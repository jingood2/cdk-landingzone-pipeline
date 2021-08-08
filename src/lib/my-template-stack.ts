import * as path from 'path';
import * as s3 from '@aws-cdk/aws-s3';
import * as cfn_inc from '@aws-cdk/cloudformation-include';
import * as cdk from '@aws-cdk/core';


export interface MyTemplateStackProps extends cdk.StackProps {

}

export class MyTemplateStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: MyTemplateStackProps) {
    super(scope, id, props);

    const BUCKET_PREFIX = 'audit-storage';

    // 1. Audit Logging Bucket
    const cfnLoggingTemplate = new cfn_inc.CfnInclude(this, 'logging-template', {
      templateFile: path.join(__dirname, '..', 'cfn-template/master/01.audit/logging.template.yaml'),
      /* parameters: {
        ['BucketName']: 'jingood0604-mutation-bucket',
      }, */
    });

    const stack = cdk.Stack.of(this);

    const cfnLoggingBucket = cfnLoggingTemplate.getResource('LoggingBucket') as s3.CfnBucket;
    cfnLoggingBucket.bucketName = `${BUCKET_PREFIX}-logging-${stack.account}`;

  }
}