import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';

export interface PermissionBoundaryConstructProps {

}

export class PermissionBoundaryConstruct extends cdk.Construct {
  public readonly createdIdentitiesPermissionsBoundary: iam.ManagedPolicy;
  public readonly adminPermissionsBoundary: iam.ManagedPolicy;
  public readonly developerPermissionsBoundary: iam.ManagedPolicy;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    /* let iamPermissionBoundaryLimit = new cdk.CfnParameter(this, 'IAMPermissionBoundaryLimitation', {
      type: 'String',
      description: 'Require all IAM Users and Roles that are created to have their PermissionsBoundary set to the CreatedIdentitiesPermissionsBoundary',
      default: 'true',
      allowedValues: ['true', 'false'],
    }).valueAsString; */

    // Restrict all actions if they are not in the AllowedRegions
    const psRegionCheck = new iam.PolicyStatement();
    psRegionCheck.sid = 'RegionCheck';
    psRegionCheck.effect = iam.Effect.DENY;
    psRegionCheck.addAllResources();
    psRegionCheck.addNotActions(
      'iam:*', 'route53:*',
    );
    //psRegionCheck.addCondition( 'ForAllValues:StringNotEquals', { 'aws:RequestedRegion': cdk.Fn.split(',', `${envVars.ALLOWED_REGIONS}`) } );
    psRegionCheck.addCondition( 'ForAllValues:StringNotEquals', { 'aws:RequestedRegion': `${envVars.ALLOWED_REGIONS}` });

    // create-identities
    var psCreateOrChangeOnlyWithBoundary = new iam.PolicyStatement();
    psCreateOrChangeOnlyWithBoundary.sid = 'CreateOrChangeOnlyWithBoundary';
    psCreateOrChangeOnlyWithBoundary.effect = iam.Effect.DENY;
    psCreateOrChangeOnlyWithBoundary.addAllResources();
    psCreateOrChangeOnlyWithBoundary.addActions(
      'iam:CreateRole',
      'iam:DeleteRolePolicy',
      'iam:AttachRolePolicy',
      'iam:DetachRolePolicy',
      'iam:PutRolePolicy',
      'iam:PutRolePermissionsBoundary',
      'iam:CreateUser',
      'iam:PutUserPolicy',
      'iam:DeleteUserPolicy',
      'iam:AttachUserPolicy',
      'iam:DetachUserPolicy',
      'iam:PutUserPermissionsBoundary',
    );
    psCreateOrChangeOnlyWithBoundary.addConditions({
      StringNotEquals: { 'iam:PermissionsBoundary': `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:policy/CreatedIdentitiesPermissionsBoundary` },
    });

    // Allowed IAM actions that don't support or need PermissionsBoundaries
    // Used for policy creation and updates from toolbox' service template.
    const psAllowedIAMActionsAgainstAnyResource = new iam.PolicyStatement();
    psAllowedIAMActionsAgainstAnyResource.sid = 'AllowedIAMActionsAgainstAnyResource';
    psAllowedIAMActionsAgainstAnyResource.effect = iam.Effect.ALLOW;
    psAllowedIAMActionsAgainstAnyResource.addAllResources();
    psAllowedIAMActionsAgainstAnyResource.addActions(
      'iam:CreateServiceLinkedRole',
      'iam:CreatePolicy',
      'iam:DeletePolicy',
      'iam:ListPolicyVersions',
      'iam:CreatePolicyVersion',
      'iam:DeletePolicyVersion',
      'iam:ListAccessKeys',
      'iam:DeleteAccessKey',
      'iam:CreateAccessKey',
      'iam:GetUser',
      'iam:GetPolicy',
      'iam:GetRole',
      'iam:PassRole',
    );

    // Do not allow users to edit the Permission Boundaries created in this template
    const psNoBoundaryPolicyEdit = new iam.PolicyStatement();
    psNoBoundaryPolicyEdit.sid = 'NoBoundaryPolicyEdit';
    psNoBoundaryPolicyEdit.effect = iam.Effect.DENY;
    psNoBoundaryPolicyEdit.addResources(`arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:policy/boundaries/*`);
    psNoBoundaryPolicyEdit.addActions(
      'iam:CreatePolicyVersion',
      'iam:DeletePolicy',
      'iam:DeletePolicyVersion',
      'iam:SetDefaultPolicyVersion',
    );

    // Do not allow developers to delete the specific roles necessary for working with the account
    // They need to be able to remove roles in case the stack creates them.
    const psNoDeleteOnAssumableRoles = new iam.PolicyStatement();
    psNoDeleteOnAssumableRoles.sid = 'NoDeleteOnAssumableRoles';
    psNoDeleteOnAssumableRoles.effect = iam.Effect.DENY;
    psNoDeleteOnAssumableRoles.addResources(
      `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/AWSCloudFormationStackSet*`,
      `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/Assumable*`,
    );
    psNoDeleteOnAssumableRoles.addNotActions(
      'iam:GetRole',
    );

    // Do not allow anyone to Delete a Permissions Boundary from users or roles
    const psNoBoundaryUserRoleDelete = new iam.PolicyStatement();
    psNoBoundaryUserRoleDelete.sid = 'NoBoundaryUserRoleDelete';
    psNoBoundaryUserRoleDelete.effect = iam.Effect.DENY;
    psNoBoundaryUserRoleDelete.addAllResources();
    psNoBoundaryUserRoleDelete.addActions(
      'iam:DeleteRolePermissionsBoundary',
      'iam:DeleteUserPermissionsBoundary',
    );

    // Allow users and roles to be deleted as stacks may create and remove them
    const psAllowUserAndRoleDelete = new iam.PolicyStatement();
    psAllowUserAndRoleDelete.sid = 'AllowUserAndRoleDelete';
    psAllowUserAndRoleDelete.effect = iam.Effect.ALLOW;
    psAllowUserAndRoleDelete.addAllResources();
    psAllowUserAndRoleDelete.addActions(
      'iam:DeleteRole',
      'iam:DeleteUser',
    );

    /////////////////////////////////////////////////////////////////////////////


    // Create createdIdentitiesPermissionsBoundary
    const pdCoreServicesDeny= new iam.PolicyDocument();

    const ps1 = new iam.PolicyStatement();
    ps1.sid = 'AllowAllServicesExcept';
    ps1.effect = iam.Effect.ALLOW;
    ps1.addAllResources();
    ps1.addNotActions(
      'iam:*', 'cloudtrail:*', 'budgets:*', 'config:*', 'guardduty:*',
    );

    const ps2 = new iam.PolicyStatement();
    ps2.sid = 'AllowIAMPassRole';
    ps2.effect = iam.Effect.ALLOW;
    ps2.addResources(`arn:aws:iam::${envVars.MASTER.ACCOUNT_ID}:role/CloudFormationRole`);
    ps2.addActions('iam:PassRole');

    const ps3 = new iam.PolicyStatement();
    ps3.sid = 'AllowIAMGetRole';
    ps3.effect = iam.Effect.ALLOW;
    ps3.addAllResources();
    ps3.addActions('iam:PassRole', 'iam:GetRole', 'iam:CreateServiceLinkedRole');

    pdCoreServicesDeny.addStatements(ps1, ps2, ps3, psRegionCheck);

    this.createdIdentitiesPermissionsBoundary = new iam.ManagedPolicy(this, 'CreatedIdentitiesPermissionsBoundary', {
      managedPolicyName: 'CreatedIdentitiesPermissionsBoundary',
      document: pdCoreServicesDeny,
    });

    // Create AdminPermissionsBoundary
    const pdAdminPermissionsBoundary= new iam.PolicyDocument();

    const ps4 = new iam.PolicyStatement();
    ps4.sid = 'AllowAdminAccess';
    ps4.effect = iam.Effect.ALLOW;
    ps4.addAllResources();
    ps4.addActions('*');

    pdAdminPermissionsBoundary.addStatements(
      psAllowedIAMActionsAgainstAnyResource,
      psNoBoundaryPolicyEdit,
      psNoDeleteOnAssumableRoles,
      psNoBoundaryUserRoleDelete,
      psAllowUserAndRoleDelete,
      ps4);

    if (envVars.IAM_PERMISSION_BOUNDARY_LIMIT == 'true') {
      pdAdminPermissionsBoundary.addStatements(psCreateOrChangeOnlyWithBoundary);
    }

    this.adminPermissionsBoundary = new iam.ManagedPolicy(this, 'AdminPermissionsBoundary', {
      managedPolicyName: 'AdminPermissionsBoundary',
      document: pdAdminPermissionsBoundary,
    });


    // Create DeveloperPermissionsBoundary
    const pdDeveloperPermissionsBoundary = new iam.PolicyDocument();

    pdDeveloperPermissionsBoundary.addStatements(
      psAllowedIAMActionsAgainstAnyResource,
      psNoBoundaryPolicyEdit,
      psNoDeleteOnAssumableRoles,
      psNoBoundaryUserRoleDelete,
      psAllowUserAndRoleDelete,
      psRegionCheck,
      ps4);

    if (envVars.IAM_PERMISSION_BOUNDARY_LIMIT == 'true') {
      pdDeveloperPermissionsBoundary.addStatements(psCreateOrChangeOnlyWithBoundary);
    }

    this.developerPermissionsBoundary = new iam.ManagedPolicy(this, 'DeveloperPermissionsBoundary', {
      managedPolicyName: 'DeveloperPermissionsBoundary',
      document: pdDeveloperPermissionsBoundary,
    });


  }
}