#!/usr/bin/env node
import { ZelleOrchestrator } from './orchestrator';
import { OrchestratorConfig } from './types';
import { logger } from './logging';

/**
 * Zelle Agent - Multi-Agent System Entry Point
 * Coordinates Social (VAPI) and Exploitation (ArcanaRed) clusters
 */

async function main() {
  logger.info('='.repeat(60));
  logger.info('    ArcanaRed - Zelle Multi-Agent System');
  logger.info('='.repeat(60));

  // Load configuration
  const config: OrchestratorConfig = {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    workflowsDir: process.env.WORKFLOWS_DIR || './workflows',
    artifactsDir: process.env.ARTIFACTS_DIR || './tmp/artifacts',
    screenshotsDir: process.env.SCREENSHOTS_DIR || './tmp/screenshots',
    maxExecutionTime: parseInt(process.env.MAX_EXECUTION_TIME || '90000', 10),
    enableExplorer: process.env.ENABLE_EXPLORER !== 'false',
    enableScoring: process.env.ENABLE_SCORING !== 'false',
  };

  // Validate configuration
  if (!config.anthropicApiKey) {
    logger.error('ANTHROPIC_API_KEY is required');
    process.exit(1);
  }

  logger.info('[Config] Redis URL:', config.redisUrl);
  logger.info('[Config] Workflows Dir:', config.workflowsDir);
  logger.info('[Config] Artifacts Dir:', config.artifactsDir);
  logger.info('[Config] Max Execution Time:', `${config.maxExecutionTime}ms`);
  logger.info('[Config] Explorer Enabled:', config.enableExplorer);
  logger.info('[Config] Scoring Enabled:', config.enableScoring);
  logger.info('');

  // Initialize orchestrator
  const orchestrator = new ZelleOrchestrator(config);

  // Graceful shutdown handlers
  const shutdown = async () => {
    logger.info('\n[Main] Received shutdown signal');
    await orchestrator.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    // Start orchestrator
    await orchestrator.start();

    logger.info('[Main] Orchestrator started successfully');
    logger.info('[Main] Waiting for Social cluster triggers...');
    logger.info('[Main] Press Ctrl+C to stop');

    // Health check loop
    setInterval(async () => {
      const health = await orchestrator.health();
      if (!health.redis) {
        logger.error('[Health] Redis connection lost!');
      }
    }, 30000); // Check every 30s

  } catch (error) {
    logger.error('[Main] Failed to start orchestrator:', error);
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  logger.error('[Main] Fatal error:', error);
  process.exit(1);
});
