import { AgentScoreEngine } from '@arcanared/score-service';
import { RunResult, AgentScore } from '../types';
import { logger } from '../logging';

/**
 * Scoring Agent - Computes AI detection signals and Agent Confidence Score
 * Analyzes behavioral patterns, timing, and anomalies from workflow execution
 */
export class ScoringAgent {
  private scoreEngine: AgentScoreEngine;

  constructor() {
    this.scoreEngine = new AgentScoreEngine();
  }

  /**
   * Analyze workflow execution and compute Agent Score
   */
  async analyze(runResult: RunResult): Promise<AgentScore> {
    logger.info('[ScoringAgent] Starting analysis...');

    try {
      // Compute agent confidence score
      const score = await this.scoreEngine.compute({
        timings: runResult.metrics.timings,
        actionSequence: runResult.metrics.actions,
        deviceFingerprint: runResult.metrics.device,
        networkFingerprint: runResult.metrics.network,
        screenshots: runResult.screenshots,
        duration: runResult.metrics.duration,
      });

      logger.info(`[ScoringAgent] Agent Score: ${score.value.toFixed(3)}`);
      logger.info(`[ScoringAgent] Top signals: ${score.signals.slice(0, 3).map(s => s.name).join(', ')}`);

      // Determine recommendation based on score thresholds
      let recommendation: 'ALLOW' | 'REVIEW' | 'BLOCK';
      if (score.value >= 0.8) {
        recommendation = 'BLOCK';
      } else if (score.value >= 0.5) {
        recommendation = 'REVIEW';
      } else {
        recommendation = 'ALLOW';
      }

      logger.info(`[ScoringAgent] Recommendation: ${recommendation}`);

      return {
        value: score.value,
        signals: score.signals,
        rationale: this.buildRationale(score),
        recommendation,
      };
    } catch (error) {
      logger.error('[ScoringAgent] Analysis failed:', error);
      
      // Return conservative score on error
      return {
        value: 0.5,
        signals: [],
        rationale: 'Analysis failed, defaulting to manual review',
        recommendation: 'REVIEW',
      };
    }
  }

  /**
   * Build human-readable rationale from score signals
   */
  private buildRationale(score: any): string {
    const topSignals = score.signals
      .filter((s: any) => s.contribution > 0.1)
      .slice(0, 3)
      .map((s: any) => `${s.name} (${(s.contribution * 100).toFixed(1)}%)`)
      .join(', ');

    if (!topSignals) {
      return 'Behavior appears normal with no significant AI indicators.';
    }

    return `High confidence AI behavior detected. Top indicators: ${topSignals}. 
    Timing patterns, action sequences, and device fingerprints suggest automated execution.`;
  }

  /**
   * Check if score exceeds critical threshold for immediate action
   */
  isCritical(score: AgentScore): boolean {
    return score.value >= 0.9 || score.recommendation === 'BLOCK';
  }

  /**
   * Generate webhook payload for Policy Engine
   */
  generateWebhookPayload(sessionId: string, score: AgentScore, runResult: RunResult): any {
    return {
      sessionId,
      timestamp: new Date().toISOString(),
      agentScore: score.value,
      recommendation: score.recommendation,
      signals: score.signals,
      rationale: score.rationale,
      bundleUrl: runResult.bundleUrl,
      duration: runResult.metrics.duration,
      workflow: 'wells_fargo_zelle',
    };
  }
}
