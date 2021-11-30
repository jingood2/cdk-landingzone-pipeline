//import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';

export interface StacksetCloudtrailProps {

}

export class StacksetCloudtrail extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string ) {
    super(scope, id);

    new cdk.CfnStackSet(this, 'cloudtrail', {
      stackSetName: 'jingood2-cloudtrail',
      permissionModel: 'SELF_MANAGED',
      capabilities: ['CAPABILITY_NAMED_IAM'],
      administrationRoleArn: `arn:aws:iam::${envVars.MASTER.ACCOUNT_ID}:role/AWSCloudFormationStackSetAdministrationRole`,
      parameters: [{
        parameterKey: 'LoggingAccount',
        parameterValue: `${envVars.LOG_ARCHIVE.ACCOUNT_ID}`,
      },
      {
        parameterKey: 'TrailBucketPrefix',
        parameterValue: 'jingood2-audit-cloudtrail',
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
      //templateBody: convertYamlString(path.join(__dirname, '../..', 'cfn-template/stack-set/03.auditing-configuration/config.template.yaml')),
      templateUrl: 'https://jingood2-stackset-template.s3.ap-northeast-2.amazonaws.com/cloudtrail.template.yaml',
    });

  }
}