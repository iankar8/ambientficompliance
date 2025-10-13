import { AgentScoreSnapshot } from '@arcanared/shared';

export type PolicyAction = 'allow' | 'review' | 'hold' | 'step_up';

export interface PolicyRule {
  threshold: number;
  action: PolicyAction;
}

export interface PolicyDecision {
  action: PolicyAction;
  reason: string;
}

export class PolicyEngine {
  constructor(private readonly rules: PolicyRule[]) {}

  evaluate(snapshot: AgentScoreSnapshot): PolicyDecision {
    const matchingRule = this.rules.find((rule) => snapshot.score >= rule.threshold);

    if (!matchingRule) {
      return { action: 'allow', reason: 'No matching rule' };
    }

    return {
      action: matchingRule.action,
      reason: `Score ${snapshot.score} met threshold ${matchingRule.threshold}`
    };
  }
}
