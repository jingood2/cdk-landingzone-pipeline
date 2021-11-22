import * as cdk from '@aws-cdk/core';
import { IamGroupConstruct } from './iam-group-construct';
//import { LogArchiveConstruct } from './log-archive-construct';

export interface MasterAccountStackProps extends cdk.StackProps {

}

export class MasterAccountStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: MasterAccountStackProps) {
    super(scope, id, props);

    //new LogArchiveConstruct(this, 'log-archive');

    // env target account : log archive
    new IamGroupConstruct(this, 'iam-group');

  }
}