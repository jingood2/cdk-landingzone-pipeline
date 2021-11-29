import * as cdk from '@aws-cdk/core';
import { StacksetStack } from './stac-sets/stackset-stack';

export interface StacksetStageProps extends cdk.StageProps{

}

export class StacksetStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props: StacksetStageProps) {
    super(scope, id, props);

    /**
     * NOTE: Add DefaultStackSynthesizer to stack
     */
    /* new MyTemplateStack(this, 'audit', {
      synthesizer: new cdk.DefaultStackSynthesizer({ qualifier: 'jingo12345' }),
      env: devEnv,
    }); */
    new StacksetStack(this, 'StackSet', {});

    /* new LoggingAccountStack(this, 'logging', {
      //synthesizer: new cdk.DefaultStackSynthesizer({ qualifier: 'jingo12345' }),
      env: { account: '037729278610', region: 'ap-northeast-2' },
    }); */
  }
}