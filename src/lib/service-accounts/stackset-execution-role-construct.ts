import * as path from 'path';
import * as cfn_inc from '@aws-cdk/cloudformation-include';
import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';

export interface StacksetExecutionRoleConstructProps {

}

export class StacksetExecutionRoleConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const cfnTemplate = new cfn_inc.CfnInclude(this, 'stackset-execution-role-template', {
      templateFile: path.join(__dirname, '../..', 'cfn-template/stack-set/00.stackset-execution-role/stackset-role.template.yaml'),
    });

    const param: cdk.CfnParameter = cfnTemplate.getParameter('MainAccount');
    param.default = `${envVars.MASTER.ACCOUNT_ID}`;
  }
}