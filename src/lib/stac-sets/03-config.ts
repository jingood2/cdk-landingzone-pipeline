//import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';

export interface StacksetConfigProps {

}

export class StacksetConfig extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string ) {
    super(scope, id);

    new cdk.CfnStackSet(this, 'config', {
      stackSetName: `${envVars.COMPANY_NAME}-config`,
      permissionModel: 'SELF_MANAGED',
      capabilities: ['CAPABILITY_NAMED_IAM'],
      administrationRoleArn: `arn:aws:iam::${envVars.MASTER.ACCOUNT_ID}:role/AWSCloudFormationStackSetAdministrationRole`,
      stackInstancesGroup: [
        {
          regions: ['ap-northeast-2'],
          deploymentTargets: {
            accounts: envVars.SERVICE_ACCOUNTS.map(value => { return value.Id; }),
          },
          parameterOverrides: [{
            parameterKey: 'LoggingAccount',
            parameterValue: `${envVars.LOG_ARCHIVE.ACCOUNT_ID}`,
          },
          {
            parameterKey: 'DeliveryFrequency',
            parameterValue: `${envVars.LOG_ARCHIVE.DELIVERY_FREQUENCY}`,
          },
          {
            parameterKey: 'ConfigBucketPrefix',
            parameterValue: `${envVars.LOG_ARCHIVE.BUCKET_PREFIX}-config`,
          },
          {
            parameterKey: 'GlobalConfigRegion',
            parameterValue: 'ap-northeast-2',
          }],
        },
      ],
      //templateBody: convertYamlString(path.join(__dirname, '../..', 'cfn-template/stack-set/03.auditing-configuration/config.template.yaml')),
      templateUrl: 'https://jingood2-stackset-template.s3.ap-northeast-2.amazonaws.com/config.template.yaml',
    });

  }
}