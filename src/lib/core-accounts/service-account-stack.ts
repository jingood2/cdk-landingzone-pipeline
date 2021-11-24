import * as cdk from '@aws-cdk/core';
import { PasswordPolicy } from '../stac-sets/01-password-policy';

export interface ServiceAccountStackProps extends cdk.StackProps {

}

export class ServiceAccountStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ServiceAccountStackProps) {
    super(scope, id, props);

    new PasswordPolicy(this, 'PasswordPolicy');


  }
}