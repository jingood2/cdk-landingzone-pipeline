import * as cdk from '@aws-cdk/core';
import { StacksetExecutionRoleConstruct } from '../service-accounts/stackset-execution-role-construct';
//import { IamGroupConstruct } from './iam-group-construct';
import { LogArchiveConstruct } from './log-archive-construct';

export interface LoggingAccountStackProps extends cdk.StackProps {

}

export class LoggingAccountStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: LoggingAccountStackProps) {
    super(scope, id, props);

    new LogArchiveConstruct(this, 'log-archive');

    new StacksetExecutionRoleConstruct(this, 'StacksetExecutionRole');
    // env target account : log archive
    //new IamGroupConstruct(this, 'iam-group');

  }
}