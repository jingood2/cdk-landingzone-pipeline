import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';

export interface GuarddutyMemberProps {

}

export class StacksetGuarddutyMemberRole extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string ) {
    super(scope, id);

    new cdk.CfnStackSet(this, 'guardduty-member', {
      stackSetName: `${envVars.COMPANY_NAME}-guarddutymember`,
      permissionModel: 'SELF_MANAGED',
      capabilities: ['CAPABILITY_NAMED_IAM'],
      administrationRoleArn: `arn:aws:iam::${envVars.MASTER.ACCOUNT_ID}:role/AWSCloudFormationStackSetAdministrationRole`,
      parameters: [{
        parameterKey: 'MasterAccount',
        parameterValue: envVars.MASTER.ACCOUNT_ID,
      }],
      //templateBody: convertYamlString(path.join(__dirname, '../..', 'cfn-template/stack-set/01.assumable-role/assume-role.yaml')),
      templateUrl: 'https://jingood2-stackset-template.s3.ap-northeast-2.amazonaws.com/guardduty-member.template.yaml',
    });

  }
}