import { randomUUID } from 'crypto';
import { ExplorerService } from '@arcanared/explorer-service';
import { WorkflowCompiler } from '@arcanared/workflow-compiler';
import { RunnerService } from '@arcanared/runner-service';
import { ArtifactProcessor } from '@arcanared/artifact-processor';
import { AgentScoreService } from '@arcanared/score-service';
import { PolicyDecision, PolicyEngine } from '@arcanared/policy-engine';
import { ExporterService } from '@arcanared/exporter-service';
import { ObserverService } from '@arcanared/observer-service';
import {
  RunMetadata,
  AgentScoreSnapshot,
  ExportJobResult,
  ExplorerTrace
} from '@arcanared/shared';

export interface PipelineDependencies {
  explorer: ExplorerService;
  compiler: WorkflowCompiler;
  runner: RunnerService;
  artifactProcessor: ArtifactProcessor;
  scoreService: AgentScoreService;
  policyEngine: PolicyEngine;
  exporter: ExporterService;
  observer: ObserverService;
}

export interface PipelineSummary {
  run: RunMetadata;
  trace: ExplorerTrace;
  scoreTimeline: AgentScoreSnapshot[];
  policyDecision: PolicyDecision;
  exportResult: ExportJobResult;
}

export class PipelineCoordinator {
  constructor(private readonly deps: PipelineDependencies) {}

  async execute(workflow: string): Promise<PipelineSummary> {
    const runMetadata: RunMetadata = {
      id: randomUUID(),
      customerId: 'demo',
      workflow,
      persona: 'baseline',
      startedAt: new Date().toISOString(),
      status: 'running'
    };

    this.deps.observer.record({ type: 'run_started', run: runMetadata });

    const explorerResult = await this.deps.explorer.run();
    const trace = explorerResult.trace;
    const dsl = this.deps.compiler.compile(trace);
    const runnerResult = await this.deps.runner.execute(dsl, { goal: trace.goal });
    const scoreTimeline = this.deps.scoreService.computeScore(runnerResult.runId, runnerResult.steps);
    const latestSnapshot: AgentScoreSnapshot =
      scoreTimeline[scoreTimeline.length - 1] ?? {
        runId: runnerResult.runId,
        stepIndex: -1,
        score: 0,
        topContributors: []
      };
    const policyDecision = this.deps.policyEngine.evaluate(latestSnapshot);
    const combinedArtifacts = [
      ...trace.artifacts,
      ...runnerResult.artifacts
    ];

    const processedArtifacts = this.deps.artifactProcessor.process({
      runId: runnerResult.runId,
      workflow,
      artifacts: combinedArtifacts
    });
    const exportResult = await this.deps.exporter.export({
      runId: runnerResult.runId,
      workflow,
      bundlePath: processedArtifacts.bundlePath,
      manifest: processedArtifacts.manifest
    });

    runMetadata.status = 'succeeded';
    runMetadata.finishedAt = new Date().toISOString();
    runMetadata.score = latestSnapshot.score;

    this.deps.observer.record({
      type: 'run_finished',
      run: runMetadata,
      scoreSnapshot: latestSnapshot
    });

    return {
      run: runMetadata,
      trace,
      scoreTimeline,
      policyDecision,
      exportResult
    };
  }
}
