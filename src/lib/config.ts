import * as chalk from 'chalk';

export const envVars = {
  REGION: process.env.REGION || 'ap-northeast-2',
  PROJECT_NAME: 'skcnc',
  GIT_PROVIDER: 'github',
  AUDIT_LOG_PREFIX: 'audit',
  INFRA: {
    REPO_NAME: process.env.REPO_NAME || 'cdk-landingzone-pipeline',
    REPO_OWNER: process.env.REPO_OWNER || 'jingood2',
    BUILD_BRANCH: process.env.BUILD_BRANCH || 'main',
    //GITHUB_TOKEN: 'devrock/github/token',
    GITHUB_TOKEN: 'atcl/jingood2/github-token',
    ZONE_NAME: 'devrock.tk' || '',
  },
  APP: {
    NAME: process.env.APP_NAME || 'demoapp',
    REPO_NAME: process.env.REPO_NAME || 'hello-app',
    REPO_OWNER: process.env.REPO_OWNER || 'jingood2',
    BUILD_BRANCH: process.env.BUILD_BRANCH || 'main',
  },
  DEV_STAGE_ENV: {
    VPC_ID: 'vpc-0132f897d8a97eb34',
    PUB_SUBNET_ID: '<<PUBLIC_SUBNET_LIST>>',
    PRI_SUBNET_ID: '<<PRIVATE_SUBNET_LIST>>',
    CERTIFICATE_ARN: 'arn:aws:acm:ap-northeast-2:037729278610:certificate/7a217ab1-40ac-489c-a6f4-a52cb5e2baf5',


  },
  PROD_STAGE_ENV: {
    VPC_ID: '<<VPC_ID>>',
    PUB_SUBNET_ID: '<<PUBLIC_SUBNET_LIST>>',
    PRI_SUBNET_ID: '<<PRIVATE_SUBNET_LIST>>',
    CERTIFICATE_ARN: 'arn:aws:acm:ap-northeast-2:955697143463:certificate/543e235d-64ca-4de6-9ead-620702c64c26',

  },
};

export function validateEnvVariables() {
  for (let variable in envVars) {
    if (!envVars[variable as keyof typeof envVars]) {
      throw Error(
        chalk.red(`[app]: Environment variable ${variable} is not defined!`),
      );
    }
  }
}