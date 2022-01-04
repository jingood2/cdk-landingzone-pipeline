import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';

export interface AssumeRoleProps {

}

export class StacksetAssumableRole extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string ) {
    super(scope, id);

    new cdk.CfnStackSet(this, 'assumable-role', {
      stackSetName: `${envVars.COMPANY_NAME}-assumable-role`,
      permissionModel: 'SELF_MANAGED',
      capabilities: ['CAPABILITY_NAMED_IAM'],
      administrationRoleArn: `arn:aws:iam::${envVars.MASTER.ACCOUNT_ID}:role/AWSCloudFormationStackSetAdministrationRole`,
      parameters: [
        {
          parameterKey: 'MasterAccount',
          parameterValue: envVars.MASTER.ACCOUNT_ID,
        },
        {
          parameterKey: 'SupportAccount',
          parameterValue: envVars.SUPPORT_ACCOUNT_ID,
        },
      ],
      stackInstancesGroup: [
        {
          regions: ['ap-northeast-2'],
          deploymentTargets: {
            accounts: envVars.SERVICE_ACCOUNTS.map(value => { return value.Id; }),
          },
          parameterOverrides: [
          /* {
            parameterKey: 'MasterAccount',
            parameterValue: envVars.MASTER.ACCOUNT_ID,
          }, */
            {
              parameterKey: 'RequestedRegion',
              parameterValue: envVars.REQUESTED_REGIONS,
            },
          ],
        },
      ],
      //templateBody: convertYamlString(path.join(__dirname, '../..', 'cfn-template/stack-set/01.assumable-role/assume-role.yaml')),
      templateUrl: 'https://jingood2-stackset-template.s3.ap-northeast-2.amazonaws.com/assumable-role.template.yaml',
    });

  }
}