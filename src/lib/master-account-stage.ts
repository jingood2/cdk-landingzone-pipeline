import * as cdk from '@aws-cdk/core';
import { devEnv } from '../main';
import { MyTemplateStack } from './my-template-stack';

export interface MasterAccountStageProps extends cdk.StageProps{

}

export class MasterAccountStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props: MasterAccountStageProps) {
    super(scope, id, props);

    /**
     * NOTE: Add DefaultStackSynthesizer to stack
     */
    new MyTemplateStack(this, 'audit', {
      synthesizer: new cdk.DefaultStackSynthesizer({ qualifier: 'jingo12345' }),
      env: devEnv,
    });
  }
}