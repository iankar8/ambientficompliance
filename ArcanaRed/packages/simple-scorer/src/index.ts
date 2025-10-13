export interface BehaviorSignals {
  // Timing signals
  avgActionDelay: number;        // ms between actions
  typingSpeed: number;           // chars per second
  totalDuration: number;         // total workflow time
  
  // Navigation signals
  directNavigation: boolean;     // Went straight to goal
  noHesitation: boolean;         // No back/forward/exploration
  linearPath: boolean;           // Sequential, no deviations
  
  // Execution signals
  perfectExecution: boolean;     // No errors/retries
  consistentTiming: boolean;     // All delays similar
  noMouseMovement: boolean;      // Direct clicks without hover
  
  // Metadata
  actionCount: number;
  errorCount: number;
  retryCount: number;
}

export interface AgentScore {
  score: number;                 // 0-100, higher = more bot-like
  confidence: number;            // 0-1, how confident in this score
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  signals: Record<string, any>; // Contributing signals
  reasoning: string;             // Human-readable explanation
  recommendations: string[];     // What to investigate
}

export class SimpleScorer {
  /**
   * Compute agent score from discovery trace
   */
  computeScore(trace: any[]): AgentScore {
    const signals = this.extractSignals(trace);
    const score = this.calculateScore(signals);
    const riskLevel = this.determineRiskLevel(score);
    const reasoning = this.generateReasoning(score, signals);
    const recommendations = this.generateRecommendations(signals);

    return {
      score,
      confidence: this.calculateConfidence(signals),
      riskLevel,
      signals: this.formatSignals(signals),
      reasoning,
      recommendations
    };
  }

  private extractSignals(trace: any[]): BehaviorSignals {
    if (!trace || trace.length === 0) {
      return this.getDefaultSignals();
    }

    // Calculate timing metrics
    const delays: number[] = [];
    const typingSpeeds: number[] = [];
    let totalDuration = 0;
    let errorCount = 0;
    let retryCount = 0;

    for (let i = 1; i < trace.length; i++) {
      const current = trace[i];
      const previous = trace[i - 1];
      
      if (current.timestamp && previous.timestamp) {
        const delay = new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime();
        delays.push(delay);
      }

      if (current.action === 'type' && current.params?.value) {
        const chars = current.params.value.length;
        const time = delays[delays.length - 1] || 1000;
        typingSpeeds.push((chars / time) * 1000); // chars per second
      }

      if (current.result === 'error' || current.error) {
        errorCount++;
      }

      if (current.action === 'retry') {
        retryCount++;
      }
    }

    if (trace.length > 0 && trace[0].timestamp && trace[trace.length - 1].timestamp) {
      totalDuration = new Date(trace[trace.length - 1].timestamp).getTime() - 
                     new Date(trace[0].timestamp).getTime();
    }

    const avgActionDelay = delays.length > 0 
      ? delays.reduce((sum, d) => sum + d, 0) / delays.length 
      : 1000;

    const typingSpeed = typingSpeeds.length > 0
      ? typingSpeeds.reduce((sum, s) => sum + s, 0) / typingSpeeds.length
      : 5;

    // Calculate navigation patterns
    const states = trace.map(e => e.state).filter(Boolean);
    const uniqueStates = new Set(states);
    const directNavigation = states.length === uniqueStates.size; // No revisiting states
    const noHesitation = !trace.some(e => e.action === 'wait' || e.action === 'back');
    const linearPath = this.isLinearPath(trace);

    // Calculate execution quality
    const perfectExecution = errorCount === 0 && retryCount === 0;
    const consistentTiming = this.isConsistentTiming(delays);
    const noMouseMovement = !trace.some(e => e.action === 'hover' || e.action === 'move');

    return {
      avgActionDelay,
      typingSpeed,
      totalDuration,
      directNavigation,
      noHesitation,
      linearPath,
      perfectExecution,
      consistentTiming,
      noMouseMovement,
      actionCount: trace.length,
      errorCount,
      retryCount
    };
  }

  private calculateScore(signals: BehaviorSignals): number {
    let score = 0;

    // Timing signals (40 points max)
    if (signals.avgActionDelay < 300) {
      score += 20; // Very fast
    } else if (signals.avgActionDelay < 800) {
      score += 15; // Fast
    } else if (signals.avgActionDelay < 1500) {
      score += 5; // Normal
    }

    if (signals.typingSpeed > 15) {
      score += 15; // Superhuman typing
    } else if (signals.typingSpeed > 8) {
      score += 10; // Fast typing
    } else if (signals.typingSpeed > 5) {
      score += 3; // Normal typing
    }

    if (signals.totalDuration < 10000) {
      score += 5; // Suspiciously fast workflow
    }

    // Navigation signals (30 points max)
    if (signals.directNavigation) score += 12;
    if (signals.noHesitation) score += 10;
    if (signals.linearPath) score += 8;

    // Execution signals (30 points max)
    if (signals.perfectExecution) score += 10;
    if (signals.consistentTiming) score += 10;
    if (signals.noMouseMovement) score += 10;

    return Math.min(100, Math.round(score));
  }

  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private calculateConfidence(signals: BehaviorSignals): number {
    // More actions = higher confidence
    let confidence = 0.5;
    
    if (signals.actionCount > 10) confidence += 0.2;
    if (signals.actionCount > 20) confidence += 0.1;
    if (signals.totalDuration > 5000) confidence += 0.1;
    if (signals.errorCount === 0) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  private generateReasoning(score: number, signals: BehaviorSignals): string {
    const reasons: string[] = [];

    if (signals.avgActionDelay < 500) {
      reasons.push(`Very fast action execution (${Math.round(signals.avgActionDelay)}ms average delay)`);
    }

    if (signals.typingSpeed > 10) {
      reasons.push(`Superhuman typing speed (${signals.typingSpeed.toFixed(1)} chars/second)`);
    }

    if (signals.directNavigation && signals.noHesitation) {
      reasons.push('Direct navigation with no exploration or hesitation');
    }

    if (signals.perfectExecution) {
      reasons.push('Perfect execution with zero errors or retries');
    }

    if (signals.consistentTiming) {
      reasons.push('Highly consistent timing between actions (non-human pattern)');
    }

    if (signals.noMouseMovement) {
      reasons.push('No mouse movement detected (direct element interaction)');
    }

    if (reasons.length === 0) {
      return 'Behavior appears relatively human-like with natural timing and navigation patterns.';
    }

    return `High bot likelihood detected: ${reasons.join('; ')}.`;
  }

  private generateRecommendations(signals: BehaviorSignals): string[] {
    const recs: string[] = [];

    if (signals.avgActionDelay < 500) {
      recs.push('Add rate limiting or delays between critical actions');
    }

    if (signals.directNavigation && signals.perfectExecution) {
      recs.push('Implement CAPTCHA or behavioral challenges for suspicious patterns');
    }

    if (signals.noMouseMovement) {
      recs.push('Track mouse movement patterns as additional signal');
    }

    if (signals.typingSpeed > 10) {
      recs.push('Monitor typing speed and flag instant form fills');
    }

    if (signals.totalDuration < 15000) {
      recs.push('Add minimum time thresholds for sensitive workflows');
    }

    return recs;
  }

  private formatSignals(signals: BehaviorSignals): Record<string, any> {
    return {
      timing: {
        avg_action_delay_ms: Math.round(signals.avgActionDelay),
        typing_speed_cps: signals.typingSpeed.toFixed(1),
        total_duration_ms: signals.totalDuration
      },
      navigation: {
        direct_navigation: signals.directNavigation,
        no_hesitation: signals.noHesitation,
        linear_path: signals.linearPath
      },
      execution: {
        perfect_execution: signals.perfectExecution,
        consistent_timing: signals.consistentTiming,
        no_mouse_movement: signals.noMouseMovement,
        error_count: signals.errorCount,
        retry_count: signals.retryCount
      },
      metadata: {
        action_count: signals.actionCount
      }
    };
  }

  private isLinearPath(trace: any[]): boolean {
    // Check if workflow followed expected sequential pattern
    const states = trace.map(e => e.state).filter(Boolean);
    if (states.length < 3) return true;

    // Look for back-and-forth patterns
    for (let i = 2; i < states.length; i++) {
      if (states[i] === states[i - 2] && states[i] !== states[i - 1]) {
        return false; // Found A -> B -> A pattern
      }
    }
    return true;
  }

  private isConsistentTiming(delays: number[]): boolean {
    if (delays.length < 3) return false;
    
    const avg = delays.reduce((sum, d) => sum + d, 0) / delays.length;
    const variance = delays.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / delays.length;
    const stdDev = Math.sqrt(variance);
    
    // Low standard deviation = consistent timing
    return stdDev < (avg * 0.3);
  }

  private getDefaultSignals(): BehaviorSignals {
    return {
      avgActionDelay: 1000,
      typingSpeed: 5,
      totalDuration: 30000,
      directNavigation: false,
      noHesitation: false,
      linearPath: true,
      perfectExecution: true,
      consistentTiming: false,
      noMouseMovement: false,
      actionCount: 0,
      errorCount: 0,
      retryCount: 0
    };
  }
}
