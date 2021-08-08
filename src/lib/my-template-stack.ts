import * as path from 'path';
import * as s3 from '@aws-cdk/aws-s3';
import * as cfn_inc from '@aws-cdk/cloudformation-include';
import * as cdk from '@aws-cdk/core';


export interface MyTemplateStackProps extends cdk.StackProps {

}

export class MyTemplateStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: MyTemplateStackProps) {
    super(scope, id, props);

    // add cfn
    const cfnTemplate = new cfn_inc.CfnInclude(this, 'logging-template', {
      templateFile: path.join(__dirname, '..', 'cfn-template/master/01.audit/logging.template.yaml'),
      /* parameters: {
        ['BucketName']: 'jingood0604-mutation-bucket',
      }, */
    });

    const stack = cdk.Stack.of(this);

    const cfnBucket = cfnTemplate.getResource('LoggingBucket') as s3.CfnBucket;
    cfnBucket.bucketName = `${stack.stackName}-logging-${stack.account}`;

  }
}