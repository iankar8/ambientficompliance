import { RunnerService } from '@arcanared/runner-service';
import { PlaywrightToolExecutor } from '@arcanared/tool-executor-playwright';
import { ArtifactProcessor } from '@arcanared/artifact-processor';
import { SessionData, RunResult } from '../types';
import { logger } from '../logging';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Runner Agent - Executes deterministic replays from compiled DSL
 */
export class RunnerAgent {
  private workflowsDir: string;
  private artifactsDir: string;
  private screenshotsDir: string;

  constructor(config: {
    workflowsDir: string;
    artifactsDir: string;
    screenshotsDir: string;
  }) {
    this.workflowsDir = config.workflowsDir;
    this.artifactsDir = config.artifactsDir;
    this.screenshotsDir = config.screenshotsDir;
  }

  async execute(session: SessionData): Promise<RunResult> {
    logger.info(`[RunnerAgent] Starting replay for session ${session.sessionId}`);
    const startTime = Date.now();

    const sessionDir = path.join(this.screenshotsDir, session.sessionId);
    const artifactsSessionDir = path.join(this.artifactsDir, session.sessionId);
    await fs.mkdir(sessionDir, { recursive: true });
    await fs.mkdir(artifactsSessionDir, { recursive: true });

    const executor = new PlaywrightToolExecutor({
      captureDom: true,
      screenshotDirectory: sessionDir,
      headless: true,
      slowMo: 50,
    });

    try {
      const dslPath = path.join(this.workflowsDir, 'wells_fargo_zelle_v0.1.yaml');
      const dslExists = await this.fileExists(dslPath);

      if (!dslExists) {
        throw new Error(`DSL not found at ${dslPath}. Run Explorer first.`);
      }

      logger.info(`[RunnerAgent] Loading DSL from ${dslPath}`);

      const runner = new RunnerService(
        {
          dslPath,
          sessionContext: {
            username: session.username,
            password: session.password,
            otp: session.otp,
            dob: session.dob,
            ssn4: session.ssn4,
          },
          pauseStates: ['await_otp'],
          timeout: 90000,
        },
        executor
      );

      logger.info('[RunnerAgent] Executing workflow...');
      const runResult = await runner.execute();

      logger.info(`[RunnerAgent] Workflow executed, success: ${runResult.success}`);

      const screenshots = await this.collectScreenshots(sessionDir);

      const metrics = {
        duration: Date.now() - startTime,
        timings: runResult.timings || {},
        actions: runResult.actions || [],
        device: runResult.deviceInfo || {},
        network: runResult.networkInfo || {},
      };

      logger.info('[RunnerAgent] Processing artifacts...');
      const processor = new ArtifactProcessor();
      const bundle = await processor.createBundle({
        runId: session.sessionId,
        screenshots,
        domSnapshots: runResult.domSnapshots || [],
        har: runResult.har,
        trace: runResult.trace,
      });

      const bundleUrl = await processor.uploadToS3(bundle);
      logger.info(`[RunnerAgent] Bundle uploaded: ${bundleUrl}`);

      const duration = Date.now() - startTime;
      logger.info(`[RunnerAgent] Replay completed in ${duration}ms`);

      return {
        success: runResult.success,
        bundleUrl,
        metrics,
        screenshots,
        domSnapshots: runResult.domSnapshots,
        har: runResult.har,
        trace: runResult.trace,
      };
    } catch (error) {
      logger.error('[RunnerAgent] Execution failed:', error);
      throw error;
    } finally {
      await executor.dispose();
    }
  }

  private async collectScreenshots(dir: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dir);
      return files
        .filter((f) => f.endsWith('.png'))
        .map((f) => path.join(dir, f))
        .sort();
    } catch {
      return [];
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
