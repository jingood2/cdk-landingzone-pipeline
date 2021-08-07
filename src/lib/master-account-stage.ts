import * as cdk from '@aws-cdk/core';
import { devEnv } from '../main';
import { MyTemplateStack } from './my-template-stack';

export interface MasterAccountStageProps extends cdk.StageProps{

}

export class MasterAccountStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props: MasterAccountStageProps) {
    super(scope, id, props);

    new MyTemplateStack(this, 'MyTemplate', { env: devEnv });
  }
}