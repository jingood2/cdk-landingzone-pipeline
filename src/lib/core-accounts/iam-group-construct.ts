import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
//import { CfnOutput } from '@aws-cdk/core';
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

    const userCredentialsManagementPolicy = new iam.Policy(this, 'UserCredentialsManagementPolicy', {
      policyName: 'UserCredentialsManagementPolicy',
      document: customPolicyDocument,
    });

    if ( envVars.MASTER.REQUIRE_MFA_ON_MAIN_ACCOUNT_ACTION == 'true' ) {
      userCredentialsManagementPolicy.addStatements(new iam.PolicyStatement({
        sid: 'BlockMostAccessUnlessSignedInWithMFA',
        notActions: [
          'iam:CreateVirtualMFADevice',
          'iam:EnableMFADevice',
          'iam:ListMFADevices',
          'iam:ListUsers',
          'iam:ListVirtualMFADevices',
          'iam:ResyncMFADevice',
          'sts:AssumeRole',
          'iam:ListAccountAliases',
          'ce:GetCostAndUsage',
        ],
        resources: ['*'],
        effect: iam.Effect.DENY,
        conditions: [
          { boolIfExists: { 'aws:MultiFactorAuthPresent': 'false' } },
        ],
      }));

      userCredentialsManagementPolicy.addStatements(new iam.PolicyStatement({
        sid: 'BlockSTSAssumeRoleOnMainAccountWithoutMFA',
        actions: [
          'sts:AssumeRole',
        ],
        resources: [
          'arn:aws:iam::${AWS::AccountId}:role/*',
        ],
        effect: iam.Effect.DENY,
        conditions: [
          { boolIfExists: { 'aws:MultiFactorAuthPresent': 'false' } },
        ],
      }));
    };

    userCredentialsManagement.attachInlinePolicy(userCredentialsManagementPolicy);

    /*
    const rawPolicyA = temp.node.defaultChild as iam.PolicyStatement;

    userCredentialsManagement.attachInlinePolicy(userCredentialsManagementPolicy);

    const requireMFAOnMainAccountActions = new cdk.CfnParameter(this, 'RequireMFAOnMainAccountActions', {
      type: 'String',
      default: 'true',
    });

    const isRequireMFAOnMainAccountActions = new cdk.CfnCondition(this, 'IsRequireMFAOnMainAccountActions', {
      expression: cdk.Fn.conditionEquals(requireMFAOnMainAccountActions, 'true'),
    });

    // Configuration value that is a different string based on IsProduction
    const mfa = cdk.Fn.conditionIf(isRequireMFAOnMainAccountActions.logicalId, 'true', 'false').toString();
    new CfnOutput(this, 'IsMFA', { value: mfa }); */


    /* const policyA = new iam.Policy(this, 'PolicyA', {
      policyName: 'PolicyA',
      statements: [new iam.PolicyStatement({
        sid: 'BlockMostAccessUnlessSignedInWithMFA',
        notActions: [
          'iam:CreateVirtualMFADevice',
          'iam:EnableMFADevice',
          'iam:ListMFADevices',
          'iam:ListUsers',
          'iam:ListVirtualMFADevices',
          'iam:ResyncMFADevice',
          'sts:AssumeRole',
          'iam:ListAccountAliases',
          'ce:GetCostAndUsage',
        ],
        resources: ['*'],
        effect: iam.Effect.DENY,
        conditions: [
          { boolIfExists: { 'aws:MultiFactorAuthPresent': 'false' } },
        ],
      })],
    });

    const rawPolicyA = policyA.node.defaultChild as iam.CfnPolicy;

    rawPolicyA.cfnOptions.condition = isRequireMFAOnMainAccountActions;

    userCredentialsManagement.attachInlinePolicy(policyA); */

  }
}