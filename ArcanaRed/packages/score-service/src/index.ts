import { AgentScoreSnapshot, StepRecord } from '@arcanared/shared';

export interface ScoreContext {
  baseScore?: number;
}

export class AgentScoreService {
  constructor(private readonly context: ScoreContext = {}) {}

  computeScore(runId: string, steps: StepRecord[]): AgentScoreSnapshot[] {
    let score = this.context.baseScore ?? 50;

    return steps.map((step) => {
      score = Math.max(0, Math.min(100, score + (step.scoreDelta ?? 0)));
      return {
        runId,
        stepIndex: step.index,
        score,
        topContributors: []
      };
    });
  }
}
