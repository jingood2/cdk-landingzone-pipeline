import * as cdk from '@aws-cdk/core';
import { ServiceAccountStack } from './service-accounts/service-account-stack';

export interface ServiceAccountStageProps extends cdk.StageProps{

}

export class ServiceAccountStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props: ServiceAccountStageProps) {
    super(scope, id, props);

    /**
     * NOTE: Add DefaultStackSynthesizer to stack
     */
    /* new MyTemplateStack(this, 'audit', {
      synthesizer: new cdk.DefaultStackSynthesizer({ qualifier: 'jingo12345' }),
      env: devEnv,
    }); */
    new ServiceAccountStack(this, 'Sub1', {});

    /* new LoggingAccountStack(this, 'logging', {
      //synthesizer: new cdk.DefaultStackSynthesizer({ qualifier: 'jingo12345' }),
      env: { account: '037729278610', region: 'ap-northeast-2' },
    }); */
  }
}