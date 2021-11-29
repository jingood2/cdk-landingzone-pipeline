import * as cdk from '@aws-cdk/core';
//import { PasswordPolicy } from '../stac-sets/02-password-policy';
import { AssumableRoleConstruct } from './assumable-role-construct';
import { GuardDutyMember } from './guard-duty-member-construct';
//import { StacksetExecutionRoleConstruct } from './stackset-execution-role-construct';

export interface ServiceAccountStackProps extends cdk.StackProps {

}

export class ServiceAccountStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ServiceAccountStackProps) {
    super(scope, id, props);

    //new PasswordPolicy(this, 'password-policy');

    //new StacksetExecutionRoleConstruct(this, 'stackset-execution-role');

    new AssumableRoleConstruct(this, 'assume-role');

    new GuardDutyMember(this, 'guard-duty-member');


  }
}