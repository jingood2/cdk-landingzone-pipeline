import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { convertYamlString, envVars } from '../config';

export interface AssumeRoleProps {

}

export class AssumeRole extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string ) {
    super(scope, id);

    new cdk.CfnStackSet(this, 'assumable-role', {
      stackSetName: 'new-assumable-role',
      permissionModel: 'SELF_MANAGED',
      capabilities: ['CAPABILITY_NAMED_IAM'],
      administrationRoleArn: 'arn:aws:iam::037729278610:role/AWSCloudFormationStackSetAdministrationRole',
      parameters: [{
        parameterKey: 'MaxSessionDuration',
        parameterValue: '28800',
      }],
      stackInstancesGroup: [
        {
          regions: ['ap-northeast-2'],
          deploymentTargets: {
            accounts: envVars.SERVICE_ACCOUNTS.map(value => { return value.Id; }),
          },
        },
      ],
      templateBody: convertYamlString(path.join(__dirname, '../..', 'cfn-template/stack-set/01.assumable-role/assume-role.yaml')),
    });

  }
}