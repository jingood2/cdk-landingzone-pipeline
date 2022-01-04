import * as path from 'path';
import * as config from '@aws-cdk/aws-config';
import * as glue from '@aws-cdk/aws-glue';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3n from '@aws-cdk/aws-s3-notifications';
import * as cfn_inc from '@aws-cdk/cloudformation-include';
import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';

export interface LogArchiveConstructProps extends cdk.StackProps{

}

export interface GluePartitionInfo {
  partitionCheckTable: string;
  glueTable: string;
  athenaQueryResults: string;
  auditingGlueDatabaseName: string;
}

export class LogArchiveConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string ) {
    super(scope, id);

    const logingBucket = new s3.Bucket(this, 'logging-bucket', {
      bucketName: `${envVars.LOG_ARCHIVE.BUCKET_PREFIX}-logging-${envVars.LOG_ARCHIVE.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
      serverAccessLogsPrefix: 'logging',
    });

    const cloudtrailBucket = new s3.Bucket(this, 'cloudtrail-bucket', {
      bucketName: `${envVars.LOG_ARCHIVE.BUCKET_PREFIX}-cloudtrail-${envVars.LOG_ARCHIVE.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      serverAccessLogsBucket: logingBucket,
      serverAccessLogsPrefix: 'cloudtrail-logs',
      versioned: false,
    });

    // cloudtrail bucket policies
    cloudtrailBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSCloudTrailBucketPermissionsCheck',
      principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
      actions: ['s3:GetBucketAcl'],
      resources: [`${cloudtrailBucket.bucketArn}`],
    }));
    cloudtrailBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSCloudTrailBucketDelivery',
      principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
      actions: ['s3:PutObject'],
      resources: [`${cloudtrailBucket.bucketArn}/*`],
      conditions: { StringEquals: { 's3:x-amz-acl': 'bucket-owner-full-control' } },
    }));

    /* ADMIN Group 사용자 외에는 CloudTrail Bucket DELETE 불가 */
    cloudtrailBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'DenyAuditingStorageDelete',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:Delete*'],
      resources: [`${cloudtrailBucket.bucketArn}/*`],
      conditions: { ArnNotLike: { 'aws:PrincipalARN': `arn:aws:iam::${envVars.LOG_ARCHIVE.ACCOUNT_ID}:root` } },
    }));

    const flowlogsBucket = new s3.Bucket(this, 'flowlogs-bucket', {
      bucketName: `${envVars.LOG_ARCHIVE.BUCKET_PREFIX}-flowlogs-${envVars.LOG_ARCHIVE.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      serverAccessLogsBucket: logingBucket,
      serverAccessLogsPrefix: 'flowlogs-logs',
    });
    flowlogsBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSLogDeliveryAclCheck',
      principals: [new iam.ServicePrincipal('delivery.logs.amazonaws.com')],
      actions: ['s3:GetBucketAcl'],
      resources: [`${flowlogsBucket.bucketArn}`],
    }));
    flowlogsBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSLogDeliveryWrite',
      principals: [new iam.ServicePrincipal('delivery.logs.amazonaws.com')],
      actions: ['s3:PutObject'],
      resources: [`${flowlogsBucket.bucketArn}/*`],
      conditions: { StringEquals: { 's3:x-amz-acl': 'bucket-owner-full-control' } },
    }));


    const configBucket = new s3.Bucket(this, 'config-bucket', {
      bucketName: `${envVars.LOG_ARCHIVE.BUCKET_PREFIX}-config-${envVars.LOG_ARCHIVE.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      serverAccessLogsBucket: logingBucket,
      serverAccessLogsPrefix: 'config-logs',
      versioned: true,
    });
    configBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSConfigBucketPermissionsCheck',
      principals: [new iam.ServicePrincipal('config.amazonaws.com')],
      actions: ['s3:GetBucketAcl'],
      resources: [`${configBucket.bucketArn}`],
    }));
    configBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSConfigBucketDelivery',
      principals: [new iam.ServicePrincipal('config.amazonaws.com')],
      actions: ['s3:PutObject'],
      resources: [`${configBucket.bucketArn}/*`],
      conditions: { StringEquals: { 's3:x-amz-acl': 'bucket-owner-full-control' } },
    }));

    new config.CfnConfigurationAggregator(this, 'ConfigConfigurationAggregator', {
      configurationAggregatorName: `${envVars.COMPANY_NAME}-ConfigurationAggregator`,
      accountAggregationSources: [{
        accountIds: envVars.SERVICE_ACCOUNTS.map(value => { return value.Id; }),
        awsRegions: ['ap-northeast-2'],
        allAwsRegions: false,
      }],
    });

    //const accounts = envVars.SERVICE_ACCOUNTS.map(value => { return value.Id; } );

    const cfnAthenaTemplate = new cfn_inc.CfnInclude(this, 'athena-template', {
      templateFile: path.join(__dirname, '../..', 'cfn-template/master/01.audit/athena.template.yaml'),
    });
    const cfnAthenaBucket = cfnAthenaTemplate.getResource('AthenaQueryResults') as s3.CfnBucket;
    cfnAthenaBucket.bucketName = `${envVars.LOG_ARCHIVE.BUCKET_PREFIX}-athenaqueryresult-${envVars.LOG_ARCHIVE.ACCOUNT_ID}`;

    const cfnAthenaGlueDatabase = cfnAthenaTemplate.getResource('AuditingGlueDatabase') as glue.CfnDatabase;
    cfnAthenaGlueDatabase.catalogId = `${envVars.LOG_ARCHIVE.ACCOUNT_ID}`;

    const cfnTableTemplate = new cfn_inc.CfnInclude(this, 'table-template', {
      templateFile: path.join(__dirname, '../..', 'cfn-template/master/01.audit/cloudtrail-athena/tables.template.yaml'),
    });

    const cfnCloudTrailTable = cfnTableTemplate.getResource('CloudTrailTable') as glue.CfnTable;
    cfnCloudTrailTable.databaseName = cfnAthenaGlueDatabase.ref;
    cfnCloudTrailTable.catalogId = envVars.LOG_ARCHIVE.ACCOUNT_ID;
    cfnCloudTrailTable.tableInput = {
      //name: 'cloudtrail',
      description: `CloudTrail table for ${cloudtrailBucket.bucketName}`,
      storageDescriptor: { location: `s3://${cloudtrailBucket.bucketName}/` },
    };

    // CloudTrail Glue Partitioning for queiry performance
    const cloudtrail: GluePartitionInfo = {
      partitionCheckTable: 'cloudtrail',
      glueTable: 'cloudtrail',
      athenaQueryResults: cfnAthenaBucket.bucketName,
      auditingGlueDatabaseName: 'auditing',

    };

    const cloudtrailPtLambda = this.makePartitioningLambda('CloudTrail', cloudtrail);
    cloudtrailBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(cloudtrailPtLambda));

    const cfnFlowLogsTable = cfnTableTemplate.getResource('FlowLogsTable') as glue.CfnTable;
    cfnFlowLogsTable.databaseName = cfnAthenaGlueDatabase.ref;
    cfnFlowLogsTable.catalogId = envVars.LOG_ARCHIVE.ACCOUNT_ID;
    cfnFlowLogsTable.tableInput = {
      description: `FlowLogs table for ${flowlogsBucket.bucketName}`,
      storageDescriptor: { location: `s3://${flowlogsBucket.bucketName}/` },
    };

    // FlowLog Glue Partitioning for queiry performance
    const flowlogs: GluePartitionInfo = {
      partitionCheckTable: 'flowlogs',
      glueTable: 'flowlogs',
      athenaQueryResults: cfnAthenaBucket.bucketName,
      auditingGlueDatabaseName: 'auditing',

    };

    const flowlogsPtLambda = this.makePartitioningLambda('FlogLogs', flowlogs);
    flowlogsBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(flowlogsPtLambda));

  }

  private makePartitioningLambda(tablename: string, gluePartition:GluePartitionInfo) : lambda.Function {

    const myRole = new iam.Role(this, `${tablename}PartitioningLambdaExecutionRole`, {
      roleName: `${tablename}PartitioningLambdaExecutionRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      path: '/',
    });

    myRole.addToPolicy(new iam.PolicyStatement({
      sid: 'GlobalS3Permissions',
      actions: ['s3:ListAllMyBuckets', 's3:ListBucket', 's3:HeadBucket', 's3:ListObjects'],
      resources: ['*'],
    }));
    myRole.addToPolicy(new iam.PolicyStatement({
      sid: 'ResourceLevelS3Permissions',
      actions: ['s3:PutObject', 's3:GetObject', 's3:GetBucketLocation'],
      resources: ['*'],
    }));
    myRole.addToPolicy(new iam.PolicyStatement({
      sid: 'Athena',
      actions: ['athena:StartQueryExecution', 'athena:GetQueryExecution'],
      resources: ['*'],
    }));
    myRole.addToPolicy(new iam.PolicyStatement({
      sid: 'DynamoDB',
      actions: ['glue:GetDatabase', 'glue:GetTable'],
      resources: ['*'],
    }));
    myRole.addToPolicy(new iam.PolicyStatement({
      sid: 'Glue',
      actions: ['glue:GetDatabase', 'glue:GetTable', 'glue:BatchCreatePartition'],
      resources: ['*'],
    }));

    const fn = new lambda.Function(this, `${tablename}PartitioningLambdaFunction`, {
      runtime: lambda.Runtime.PYTHON_3_6,
      functionName: `${tablename}PatitioningLambdaFunction`,
      timeout: cdk.Duration.seconds(180),
      handler: 'partition.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../..', 'lambda-handler')),
      logRetention: logs.RetentionDays.FIVE_DAYS,
      environment: {
        PartitionCheckTable: gluePartition.partitionCheckTable,
        GlueTable: gluePartition.glueTable,
        AthenaQueryResults: gluePartition.athenaQueryResults,
        AuditingGlueDatabaseName: 'auditing',
      },
      role: myRole,
    });

    // Resource-based Policies
    // Permission to invoke lambda function from s3.amazonaws.com
    fn.grantInvoke(new iam.ServicePrincipal('s3.amazonaws.com'));

    return fn;
  }
}