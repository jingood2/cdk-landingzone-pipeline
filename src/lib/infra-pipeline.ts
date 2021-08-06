import * as codecommit from '@aws-cdk/aws-codecommit';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as cdk from '@aws-cdk/core';
import * as pipelines from '@aws-cdk/pipelines';
import { envVars } from './config';

export interface InfraPipelineProps extends cdk.StackProps {

}

export class InfraPipeline extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: InfraPipelineProps) {
    super(scope, id, props);

    const sourceArtifact = new codepipeline.Artifact('Source');
    const cdkOutputArtifact = new codepipeline.Artifact('CdkOutput');

    var sourceAction;

    // NOTE: Specify your pipeline repository info
    if (envVars.GIT_PROVIDER == 'github') {
      sourceAction = new codepipeline_actions.GitHubSourceAction({
        actionName: 'Github-Source',
        owner: `${envVars.INFRA.REPO_OWNER}`,
        repo: envVars.INFRA.REPO_NAME,
        oauthToken: cdk.SecretValue.secretsManager(`${envVars.INFRA.GITHUB_TOKEN}`),
        branch: 'main',
        output: sourceArtifact,
        trigger: codepipeline_actions.GitHubTrigger.POLL,
      });
    } else {
      const repo = new codecommit.Repository(this, 'Repo', {
        repositoryName: envVars.INFRA.REPO_NAME,
        description: 'aws cdk vpc pipeline repository',
      });

      sourceAction = new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'codecommit',
        output: sourceArtifact,
        branch: 'main',
        trigger: codepipeline_actions.CodeCommitTrigger.EVENTS,
        repository: repo,
      });

    }

    //const pipeline = new pipelines.CdkPipeline(this, 'CdkPipeline', {
    new pipelines.CdkPipeline(this, 'CdkPipeline', {
      pipelineName: `${envVars.PROJECT_NAME}-infra-pipeline`,
      cloudAssemblyArtifact: cdkOutputArtifact,
      sourceAction: sourceAction,
      synthAction: pipelines.SimpleSynthAction.standardYarnSynth({
        sourceArtifact: sourceArtifact,
        cloudAssemblyArtifact: cdkOutputArtifact,
        //subdirectory: 'infra',
        installCommand: 'yarn install --frozen-lockfile && yarn projen',
        buildCommand: 'yarn build',
      }),
    });

  }
}