import * as cdk from '@aws-cdk/core';
//import { StacksetExecutionRoleConstruct } from '../service-accounts/stackset-execution-role-construct';
import { AssumeRoleConstruct } from './assume-role-construct';
import { GuardDutyMainConstruct } from './guard-duty-main-construct';
//import { GuardDutyMainConstruct } from './guard-duty-main-construct';
import { IamGroupConstruct } from './iam-group-construct';
//import { LogArchiveConstruct } from './log-archive-construct';

export interface MasterAccountStackProps extends cdk.StackProps {

}

export class MasterAccountStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: MasterAccountStackProps) {
    super(scope, id, props);

    //new LogArchiveConstruct(this, 'log-archive');
    //new StacksetExecutionRoleConstruct(this, 'StackSetAdminRole', { stacksetRole: 'admin' } );

    // env target account : log archive
    new IamGroupConstruct(this, 'iam-group');

    new AssumeRoleConstruct(this, 'assume-role');

    new GuardDutyMainConstruct(this, 'guardduty-main');

  }
}