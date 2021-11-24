import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';

export interface PasswordPolicyProps {

}

export class PasswordPolicy extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string ) {
    super(scope, id);

    new cdk.CfnStackSet(this, 'password-policy', {
      stackSetName: 'the-new-password-policy',
      permissionModel: 'SERVICE_MANAGED',
      capabilities: ['CAPABILITY_IAM'],
      stackInstancesGroup: [
        {
          regions: ['ap-northeast-2'],
          deploymentTargets: {
            accounts: envVars.SERVICE_ACCOUNTS.map(value => { return value.Id; }),
          },
        },
      ],
      templateUrl: 'https://jingood2-stackset-template.s3.ap-northeast-2.amazonaws.com/stackset-password-policy.yaml',
    });
  }
}