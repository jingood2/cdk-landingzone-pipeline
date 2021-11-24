import * as cdk from '@aws-cdk/core';
import { AssumeRole } from '../stac-sets/01-assume-role';
import { PasswordPolicy } from '../stac-sets/02-password-policy';

export interface ServiceAccountStackProps extends cdk.StackProps {

}

export class ServiceAccountStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ServiceAccountStackProps) {
    super(scope, id, props);

    new PasswordPolicy(this, 'password-policy');

    new AssumeRole(this, 'assume-role');


  }
}