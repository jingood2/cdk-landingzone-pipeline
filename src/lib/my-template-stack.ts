import * as path from 'path';
import * as cfn_inc from '@aws-cdk/cloudformation-include';
import * as cdk from '@aws-cdk/core';


export interface MyTemplateStackProps extends cdk.StackProps {

}

export class MyTemplateStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: MyTemplateStackProps) {
    super(scope, id, props);

    // add cfn
    new cfn_inc.CfnInclude(this, 'Template', {
      templateFile: path.join(__dirname, '..', 'cfn-template/master/my-template.yaml'),
    });

  }
}