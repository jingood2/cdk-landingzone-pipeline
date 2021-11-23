import * as cdk from '@aws-cdk/core';
//import * as iam from '@aws-cdk/aws-iam';

export interface AssumeRoleConstructProps {

}

export class AssumeRoleConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string ) {
    super(scope, id);

    /* const ROLES = [
      'Admin',
      'Developer',
      'CloudFormationDeveloper',
      'ReadOnly',
      'SecurityAudit',
      'Operations',
      'AwsPowerUser',
      'AwsSupportUser',
    ]; */

    // 1. AdminMasterGroup
    /*   for (let role in ROLES ) {
      var AdminMasterGroup = new iam.Group(this, `Assume${role}_${Account['Name']}_${Account['Id']}`, {
        groupName: `Assume${role}_${Account['Name']}_${Account['Id']}`,
        path: '/assume/',
      });
    } */

  }
}