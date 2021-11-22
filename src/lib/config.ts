import * as chalk from 'chalk';

export const envVars = {
  REGION: process.env.REGION || 'ap-northeast-2',
  COMPANY_NAME: 'acme',
  PROJECT_NAME: 'lz',
  SOURCE_PROVIDER: 'GITHUB',
  REPO: process.env.REPO_NAME || 'jingood2/cdk-landingzone-pipeline',
  BRANCH: 'main',
  GITHUB_TOKEN: 'atcl/jingood2/github-token',
  MASTER: {
    ACCOUNT_ID: '037729278610',
    REQUIRE_MFA_ON_MAIN_ACCOUNT_ACTION: 'true',
  },
  LOG_ARCHIVE: {
    ACCOUNT_ID: '318126949465',
    BUCKET_PREFIX: 'new-audit',
  },
  SERVICE: {
    LIST_OF_ACCOUNTS: [''],
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