import * as cdk from '@aws-cdk/core';

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
    /* const AdminMasterGroup = new iam.Group(this, 'AdminGroup', {
      groupName: 'AdminMasterAccountGroup',
      path: '/assume/',
    }); */

  }
}