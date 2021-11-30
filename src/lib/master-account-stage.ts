import * as cdk from '@aws-cdk/core';
import { envVars } from './config';
//import { devEnv } from '../main';
//import { LoggingAccountStack } from './core-accounts/logging-account-stack';
import { MasterAccountStack } from './core-accounts/master-account-stack';
//import { MasterAccountStack } from './core-accounts/master-account-stack';
//import { MyTemplateStack } from './my-template-stack';

export interface MasterAccountStageProps extends cdk.StageProps{

}

export class MasterAccountStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props: MasterAccountStageProps) {
    super(scope, id, props);

    /**
     * NOTE: Add DefaultStackSynthesizer to stack
     */
    /* new MyTemplateStack(this, 'audit', {
      synthesizer: new cdk.DefaultStackSynthesizer({ qualifier: 'jingo12345' }),
      env: devEnv,
    }); */
    new MasterAccountStack(this, `${envVars.MASTER.ACCOUNT_ID}-Stack`, {
      //synthesizer: new cdk.DefaultStackSynthesizer({ qualifier: 'jingo12345' }),
      //env: { account: `${envVars.MASTER.ACCOUNT_ID}`, region: 'ap-northeast-2' },
    });

    /* new LoggingAccountStack(this, 'logging', {
      //synthesizer: new cdk.DefaultStackSynthesizer({ qualifier: 'jingo12345' }),
      env: { account: '037729278610', region: 'ap-northeast-2' },
    }); */
  }
}