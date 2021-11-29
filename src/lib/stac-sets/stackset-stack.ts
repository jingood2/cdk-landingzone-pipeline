import * as cdk from '@aws-cdk/core';
import { PasswordPolicy } from './02-password-policy';
//import { PasswordPolicy } from '../stac-sets/02-password-policy';

export interface StacksetStackProps extends cdk.StackProps {

}

export class StacksetStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: StacksetStackProps) {
    super(scope, id, props);

    new PasswordPolicy(this, 'password-policy');


  }
}