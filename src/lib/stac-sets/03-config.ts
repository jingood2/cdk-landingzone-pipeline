import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { convertYamlString, envVars } from '../config';

export interface StacksetConfigProps {

}

export class StacksetConfig extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string ) {
    super(scope, id);

    new cdk.CfnStackSet(this, 'config', {
      stackSetName: 'new-config',
      permissionModel: 'SELF_MANAGED',
      capabilities: ['CAPABILITY_NAMED_IAM'],
      administrationRoleArn: `arn:aws:iam::${envVars.MASTER.ACCOUNT_ID}:role/AWSCloudFormationStackSetAdministrationRole`,
      parameters: [{
        parameterKey: 'LoggingAccount',
        parameterValue: `${envVars.LOG_ARCHIVE.ACCOUNT_ID}`,
      },
      {
        parameterKey: 'DeliveryFrequency',
        parameterValue: 'One_Hour',
      },
      {
        parameterKey: 'ConfigBucketPrefix',
        parameterValue: 'new-audit-storage-config',
      },
      {
        parameterKey: 'GlobalConfigRegion',
        parameterValue: 'ap-northeast-2',
      }],
      stackInstancesGroup: [
        {
          regions: ['ap-northeast-2'],
          deploymentTargets: {
            accounts: envVars.SERVICE_ACCOUNTS.map(value => { return value.Id; }),
          },
        },
      ],
      templateBody: convertYamlString(path.join(__dirname, '../..', 'cfn-template/stack-set/03.auditing-configuration/config.template.yaml')),
    });

  }
}