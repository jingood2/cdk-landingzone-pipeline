import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';

export interface PasswordPolicyProps {

}

export class PasswordPolicy extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string ) {
    super(scope, id);

    new cdk.CfnStackSet(this, 'password-policy', {
      stackSetName: 'new-password-policy',
      permissionModel: 'SELF_MANAGED',
      stackInstancesGroup: [
        {
          // TODOS: Apply ALL REGITION
          regions: ['ap-northeast-2'],
          deploymentTargets: {
            accounts: envVars.SERVICE_ACCOUNTS.map(value => { return value.Id; }),
          },
        },
      ],
      templateUrl: 's3://jingood2-stackset-template/stackset-password-policy.yaml',
    });
  }
}