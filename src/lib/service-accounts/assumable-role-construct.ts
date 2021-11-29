import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';
import { PermissionBoundaryConstruct } from './permission-boundary-construct';

export interface AssumableRoleConstructProps {

}

export class AssumableRoleConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string ) {
    super(scope, id);

    /* const ROLES = [
      'Admin',
      'Developer',
      'CloudFormationDeveloper',
      'ReadOnly',
      'SecurityAudit',
      'Operations',
      'AwsPowerUser',
      'AwsSupportUser',
    ]; */

    /* const MFA = new cdk.CfnParameter(this, 'MFA', {
      type: 'String',
      description: 'Require MFA when assuming into a Role',
      default: 'true',
      allowedValues: ['true', 'false'],
    }).valueAsString;

    const hasMFAEnabled = new cdk.CfnCondition(this, 'HasMFAEnabled', {
      expression: cdk.Fn.conditionEquals('true', MFA),
    }); */

    // Restrict all actions if they are not in the AllowedRegions
    /*     const psAssumeRole = new iam.PolicyStatement();
    psAssumeRole.addPrincipals(new iam.AccountPrincipal(`${envVars.MASTER.ACCOUNT_ID}`));
    psAssumeRole.effect = iam.Effect.ALLOW;
    psAssumeRole.addActions('sts:AssumeRole');
    //psRegionCheck.addCondition( 'ForAllValues:StringNotEquals', { 'aws:RequestedRegion': cdk.Fn.split(',', `${envVars.ALLOWED_REGIONS}`) } );
    psAssumeRole.addCondition( 'BoolIfExists', { 'aws:MultiFactorAuthPresent': 'true'});
 */

    const boundaries = new PermissionBoundaryConstruct(this, 'PermissionBoundaryConstruct');

    const assumableAdminRole = new iam.Role(this, 'AssumableAdminRole', {
      roleName: 'AssumableAdminRole',
      //assumedBy: new iam.AccountPrincipal(`${envVars.MASTER.ACCOUNT_ID}`).withConditions(cdk.Fn.conditionIf(hasMFAEnabled.logicalId, { BoolIfExists: { 'aws:MultiFactorAuthPresent': 'true' } }, cdk.Aws.NO_VALUE)),
      assumedBy: new iam.AccountPrincipal(`${envVars.MASTER.ACCOUNT_ID}`).withConditions({ BoolIfExists: { 'aws:MultiFactorAuthPresent': 'true' } }),
      //externalIds: ['MASTER_ACCOUNT'],
      description: 'this is custom AssumableAdminRole',
      permissionsBoundary: boundaries.adminPermissionsBoundary,
      maxSessionDuration: cdk.Duration.seconds(28800),
    });

    assumableAdminRole.attachInlinePolicy(
      new iam.Policy(this, 'AdminAccess', {
        statements: [
          new iam.PolicyStatement({
            sid: 'AdminAccess2',
            actions: ['*'],
            resources: ['*'],
            effect: iam.Effect.ALLOW,
          }),
        ],
      }),
    );

    const assumableDeveloperRole = new iam.Role(this, 'AssumableDeveloperRole', {
      roleName: 'AssumableDeveloperRole',
      //assumedBy: new iam.AccountPrincipal(`${envVars.MASTER.ACCOUNT_ID}`).withConditions(cdk.Fn.conditionIf(hasMFAEnabled.logicalId, { BoolIfExists: { 'aws:MultiFactorAuthPresent': 'true' } }, cdk.Aws.NO_VALUE)),
      assumedBy: new iam.AccountPrincipal(`${envVars.MASTER.ACCOUNT_ID}`).withConditions({ BoolIfExists: { 'aws:MultiFactorAuthPresent': 'true' } }),
      //externalIds: ['MASTER_ACCOUNT'],
      description: 'this is custom AssumableDeveloperRole',
      permissionsBoundary: boundaries.developerPermissionsBoundary,
      maxSessionDuration: cdk.Duration.seconds(28800),
    });

    assumableDeveloperRole.addManagedPolicy({
      managedPolicyArn: 'arn:aws:iam::aws:policy/ReadOnlyAccess',
    });

    assumableDeveloperRole.attachInlinePolicy(
      new iam.Policy(this, 'CloudFormation', {
        policyName: 'CloudFormation',
        statements: [
          new iam.PolicyStatement({
            sid: 'AllowDeveloperAccess',
            actions: ['*'],
            resources: ['*'],
            effect: iam.Effect.ALLOW,
          }),
        ],
      }),
    );


  }
}