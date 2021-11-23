import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';

export interface IamGroupConstructProps {

}

export class IamGroupConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string ) {
    super(scope, id);

    // 1. AdminMasterGroup
    const AdminMasterGroup = new iam.Group(this, 'AdminGroup', {
      groupName: 'AdminMasterAccountGroup',
      path: '/admin/',
    });

    const adminPolicy = new iam.Policy(this, 'AdminPolicy', {
      policyName: 'AdminPolicy',
      statements: [new iam.PolicyStatement({
        sid: 'AdminMasterAccountPolicy',
        actions: ['*'],
        resources: ['*'],
        effect: iam.Effect.ALLOW,
      })],

    });

    AdminMasterGroup.attachInlinePolicy(adminPolicy);

    // 2.UserManagement
    const userMangementGroup = new iam.Group(this, 'UserMangementGroup', {
      groupName: 'UserManagementGroup',
      path: '/admin/',
    });

    const userManagementPolicy = new iam.Policy(this, 'UserMangementPolicy', {
      policyName: 'UserManagementPolicy',
      statements: [new iam.PolicyStatement({
        sid: 'UserCreation',
        actions: [
          'iam:CreateLoginProfile',
          'iam:CreateUser',
        ],
        resources: ['*'],
        effect: iam.Effect.ALLOW,
      })],
    });

    userMangementGroup.attachInlinePolicy(userManagementPolicy);

    // 2.UserManagement
    const userCredentialsManagement = new iam.Group(this, 'UserCredentialsManagement', {
      groupName: 'UserCredentialsManagementGroup',
      path: '/admin/',
    });

    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowIAMReadOnly',
          Effect: 'Allow',
          Action: [
            'iam:GenerateCredentialReport',
            'iam:Get*',
            'iam:List*',
            'iam:SimulateCustomPolicy',
            'iam:SimulatePrincipalPolicy',
          ],
          Resource: '*',
        },
        {
          Effect: 'Allow',
          Action: [
            'iam:GetAccountPasswordPolicy',
          ],
          Resource: '*',
        },
        {
          Effect: 'Allow',
          Action: [
            'iam:GetLoginProfile',
            'iam:UpdateLoginProfile',
            'iam:ChangePassword',
          ],
          Resource: [
            'arn:aws:iam::*:user/${aws:username}',
          ],
        },
        {
          Effect: 'Allow',
          Action: [
            'iam:ListUsers',
            'iam:ListVirtualMFADevices',
          ],
          Resource: '*',
        },
        {
          Sid: 'AllowIndividualUserToListOnlyTheirOwnMFA',
          Effect: 'Allow',
          Action: [
            'iam:ListMFADevices',
          ],
          Resource: [
            'arn:aws:iam::*:mfa/*',
            'arn:aws:iam::*:user/${aws:username}',
          ],
        },
        {
          Sid: 'AllowIndividualUserToManageTheirOwnMFA',
          Effect: 'Allow',
          Action: [
            'iam:CreateVirtualMFADevice',
            'iam:DeleteVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ResyncMFADevice',
          ],
          Resource: [
            'arn:aws:iam::*:mfa/${aws:username}',
            'arn:aws:iam::*:user/${aws:username}',
          ],
        },
        {
          Sid: 'AllowIndividualUserToDeactivateOnlyTheirOwnMFAOnlyWhenUsingMFA',
          Effect: 'Allow',
          Action: [
            'iam:DeactivateMFADevice',
          ],
          Resource: [
            'arn:aws:iam::*:mfa/${aws:username}',
            'arn:aws:iam::*:user/${aws:username}',
          ],
          Condition: { Bool: { 'aws:MultiFactorAuthPresent': 'true' } },
        },
        {
          Sid: 'ManageAccessKeys',
          Effect: 'Allow',
          Action: [
            'iam:ListAccessKeys',
            'iam:CreateAccessKey',
            'iam:DeleteAccessKey',
          ],
          Resource: [
            'arn:aws:iam::*:user/${aws:username}',
          ],
        },
      ],
    };

    const customPolicyDocument = iam.PolicyDocument.fromJson(policyDocument);

    if ( envVars.MASTER.REQUIRE_MFA_ON_MAIN_ACCOUNT_ACTION == 'true' ) {

      const p2 = new iam.PolicyStatement();
      p2.sid = 'BlockMostAccessUnlessSignedInWithMFA';
      p2.effect = iam.Effect.DENY;
      p2.addAllResources();
      p2.addNotActions(
        'iam:CreateVirtualMFADevice',
        'iam:EnableMFADevice',
        'iam:ListMFADevices',
        'iam:ListUsers',
        'iam:ListVirtualMFADevices',
        'iam:ResyncMFADevice',
        'sts:AssumeRole',
        'iam:ListAccountAliases',
        'ce:GetCostAndUsage',
      );
      p2.addCondition( 'BoolIfExists', { 'aws:MultiFactorAuthPresent': 'false' } );
      customPolicyDocument.addStatements(p2);

      const p3 = new iam.PolicyStatement();
      p3.sid = 'BlockSTSAssumeRoleOnMainAccountWithoutMFA';
      p3.effect = iam.Effect.DENY;
      p3.addAllResources();
      p3.addActions( 'sts:AssumeRole' );
      p3.addResources(`arn:aws:iam::${envVars.MASTER.ACCOUNT_ID}:role/*`);
      p3.addCondition( 'BoolIfExists', { 'aws:MultiFactorAuthPresent': 'false' } );
      customPolicyDocument.addStatements(p3);

    };

    const userCredentialsManagementPolicy = new iam.Policy(this, 'UserCredentialsManagementPolicy', {
      policyName: 'UserCredentialsManagementPolicy',
      document: customPolicyDocument,
    });

    userCredentialsManagement.attachInlinePolicy(userCredentialsManagementPolicy);

  }
}