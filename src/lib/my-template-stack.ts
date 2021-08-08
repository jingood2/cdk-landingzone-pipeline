import * as path from 'path';
import * as glue from '@aws-cdk/aws-glue';
import * as s3 from '@aws-cdk/aws-s3';
import * as cfn_inc from '@aws-cdk/cloudformation-include';
import * as cdk from '@aws-cdk/core';


export interface MyTemplateStackProps extends cdk.StackProps {

}

export class MyTemplateStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: MyTemplateStackProps) {
    super(scope, id, props);

    //const BUCKET_PREFIX = 'audit';
    const STACK = cdk.Stack.of(this);

    // 1. Audit Logging Bucket
    const cfnLoggingTemplate = new cfn_inc.CfnInclude(this, 'logging-template', {
      templateFile: path.join(__dirname, '..', 'cfn-template/master/01.audit/logging.template.yaml'),
      /* parameters: {
        ['BucketName']: 'jingood0604-mutation-bucket',
      }, */
    });

    const cfnLoggingBucket = cfnLoggingTemplate.getResource('LoggingBucket') as s3.CfnBucket;
    cfnLoggingBucket.bucketName = `${STACK.stackName}-logging-${STACK.account}`;


    // 2. Audit Glue Database
    const cfnAthenaTemplate = new cfn_inc.CfnInclude(this, 'athena-template', {
      templateFile: path.join(__dirname, '..', 'cfn-template/master/01.audit/athena.template.yaml'),
    });

    const cfnAthenaGlueDatabase = cfnAthenaTemplate.getResource('AuditingGlueDatabase') as glue.CfnDatabase;
    cfnAthenaGlueDatabase.catalogId = `${STACK.account}`;

    // 3. Audit glue table
    const cfnTableTemplate = new cfn_inc.CfnInclude(this, 'table-template', {
      templateFile: path.join(__dirname, '..', 'cfn-template/master/01.audit/table.template.yaml'),
    });

    const cfnCloudTrailTable = cfnTableTemplate.getResource('CloudTrailtable') as glue.CfnTable;
    cfnCloudTrailTable.databaseName = cfnAthenaGlueDatabase.ref;
    cfnCloudTrailTable.catalogId = `${STACK.account}`;
    //cfnCloudTrailTable.tableInput = { location: `s3://${}`}


  }
}