import * as path from 'path';
import * as glue from '@aws-cdk/aws-glue';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { envVars } from './config';

export interface AuditStorageStackProps extends cdk.StackProps {

}

export class AuditStorageStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: AuditStorageStackProps) {
    super(scope, id, props);

    const logingBucket = new s3.Bucket(this, 'logging-bucket', {
      bucketName: `${envVars.AUDIT_LOG_PREFIX}-logging-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
      serverAccessLogsPrefix: 'logging',
    });

    const cloudtrailBucket = new s3.Bucket(this, 'cloudtrail-bucket', {
      bucketName: `${envVars.AUDIT_LOG_PREFIX}-cloudtrail-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      serverAccessLogsBucket: logingBucket,
      serverAccessLogsPrefix: 'cloudtrail-logs',
      versioned: true,
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
    cloudtrailBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'DenyAuditingStorageDelete',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:Delete*'],
      resources: [`${cloudtrailBucket.bucketArn}/*`],
      conditions: { ArnNotLike: { 'aws:PrincipalARN': `arn:aws:iam::${this.account}:group/admin/CAREFUL_DANGEROUS_AdminMasterAccountGroup` } },
    }));

    const configBucket = new s3.Bucket(this, 'config-bucket', {
      bucketName: `${envVars.AUDIT_LOG_PREFIX}-config-${this.account}`,
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


    //const athenaQueryResultBucket = new s3.Bucket(this, 'athena-bucket', {
    new s3.Bucket(this, 'athena-bucket', {
      bucketName: `${envVars.AUDIT_LOG_PREFIX}-athenaqueryresult-${this.account}`,
    });


    //const glueDatabase = new glue.Database(this, 'audit-database', {
    new glue.Database(this, 'audit-database', {
      databaseName: 'auditing',
    });

    //const cloudtrailPtLambda = this.makePartitioningLambda('CloudTrail');
    this.makePartitioningLambda('CloudTrail');
    //const flowlogPtLambda = this.makePartitioningLambda('FlowLog');

  }

  private makePartitioningLambda(tablename: string) : lambda.Function {

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
      resources: ['*/*'],
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
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda-handler')),
      logRetention: logs.RetentionDays.FIVE_DAYS,
      environment: {
        PartitionCheckTable: '',
        CloudTrailTable: '',
        AthenaQueryResults: '',
        AuditingGlueDatabaseName: '',
      },
      role: myRole,
    });

    // Resource-based Policies
    // Permission to invoke lambda function from s3.amazonaws.com
    fn.grantInvoke(new iam.ServicePrincipal('s3.amazonaws.com'));

    return fn;
  }
}