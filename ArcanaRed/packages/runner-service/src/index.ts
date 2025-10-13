import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import {
  WorkflowDslDocument,
  StepRecord,
  RecordedArtifact,
  RecordedArtifactType
} from '@arcanared/shared';
import {
  ToolExecutor,
  ToolExecutionContext,
  ToolExecutionResult
} from '@arcanared/explorer-service';

export interface RunnerResult {
  runId: string;
  steps: StepRecord[];
  artifacts: RecordedArtifact[];
  errors: string[];
}

export interface RunnerServiceOptions {
  executor?: ToolExecutor;
  artifactRoot?: string;
}

export interface RunnerExecuteOptions {
  goal?: string;
}

export class RunnerService {
  constructor(private readonly options: RunnerServiceOptions = {}) {}

  async execute(
    dsl: WorkflowDslDocument,
    executeOptions: RunnerExecuteOptions = {}
  ): Promise<RunnerResult> {
    if (!this.options.executor) {
      return this.fallbackExecute(dsl);
    }

    const runId = dsl.runId ?? randomUUID();
    const stepRecords: StepRecord[] = [];
    const artifacts: RecordedArtifact[] = [];
    const errors: string[] = [];
    const goal = executeOptions.goal ?? '';

    const artifactDir = path.join(
      this.options.artifactRoot ?? path.join(process.cwd(), 'tmp', 'runner-artifacts'),
      runId
    );
    await fs.mkdir(artifactDir, { recursive: true });

    for (const [index, transition] of dsl.transitions.entries()) {
      const stepId = randomUUID();
      const stepTimestamp = new Date().toISOString();
    const baseInput: Record<string, unknown> = {
      action: transition.action,
      selector: transition.selector,
      state: transition.state,
      params: transition.params ?? {}
    };

      const context: ToolExecutionContext = {
        workflow: dsl.workflow,
        goal,
        step: index,
        toolUse: {
          id: randomUUID(),
          name: transition.action,
          input: baseInput,
          type: 'tool_use'
        },
        input: baseInput
      };

      const execution = await this.options.executor.execute(context);

      const stepResult = this.buildStepRecord(
        stepId,
        runId,
        index,
        stepTimestamp,
        transition.state,
        transition
      );

      const executionErrors = await this.consumeEvents(
        execution,
        artifacts,
        artifactDir,
        index
      );

      errors.push(...executionErrors);

      if (this.toolResultHasError(execution.toolResult) || executionErrors.length > 0) {
        stepResult.result = 'failure';
      } else {
        stepResult.result = 'success';
      }

      stepRecords.push(stepResult);
    }

    return {
      runId,
      steps: stepRecords,
      artifacts,
      errors
    };
  }

  private buildStepRecord(
    id: string,
    runId: string,
    index: number,
    timestamp: string,
    state: string,
    transition: WorkflowDslDocument['transitions'][number]
  ): StepRecord {
    return {
      id,
      runId,
      index,
      timestamp,
      state,
      action: transition.action,
      selector: transition.selector,
      result: 'success',
      redacted: false
    };
  }

  private async consumeEvents(
    execution: ToolExecutionResult,
    artifacts: RecordedArtifact[],
    artifactDir: string,
    stepIndex: number
  ): Promise<string[]> {
    const errors: string[] = [];

    for (const event of execution.events ?? []) {
      switch (event.type) {
        case 'artifact': {
          artifacts.push({
            type: event.artifactType,
            path: event.path,
            contentType: event.contentType,
            description: event.description
          });
          break;
        }
        case 'dom_snapshot': {
          const domPath = path.join(
            artifactDir,
            `dom-step-${stepIndex}-${randomUUID()}.html`
          );
          await fs.writeFile(domPath, event.html, 'utf8');
          artifacts.push({
            type: this.mapArtifactType('dom_snapshot'),
            path: domPath,
            contentType: 'text/html',
            description: 'DOM snapshot'
          });
          break;
        }
        case 'network_har': {
          artifacts.push({
            type: this.mapArtifactType('har'),
            path: event.path,
            contentType: 'application/json',
            description: 'Network HAR'
          });
          break;
        }
        case 'error': {
          errors.push(event.error);
          break;
        }
        default:
          break;
      }
    }

    return errors;
  }

  private mapArtifactType(type: RecordedArtifactType): RecordedArtifactType {
    return type;
  }

  private toolResultHasError(
    toolResult: ToolExecutionResult['toolResult']
  ): boolean {
    if (!toolResult) {
      return false;
    }

    if (Array.isArray(toolResult)) {
      return toolResult.some((block) => block.is_error === true);
    }

    return toolResult.is_error === true;
  }

  private fallbackExecute(dsl: WorkflowDslDocument): RunnerResult {
    const runId = dsl.runId ?? randomUUID();
    const steps: StepRecord[] = dsl.transitions.map((transition, index) => ({
      id: randomUUID(),
      runId,
      index,
      timestamp: new Date().toISOString(),
      state: transition.state,
      action: transition.action,
      selector: transition.selector,
      result: 'failure',
      redacted: false
    }));

    return {
      runId,
      steps,
      artifacts: [],
      errors: ['Runner executor not configured']
    };
  }
}
