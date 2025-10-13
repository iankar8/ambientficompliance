import { AgentScoreSnapshot, RunMetadata } from '@arcanared/shared';

export interface ObserverEvent {
  type: 'run_started' | 'run_finished' | 'score_updated';
  run: RunMetadata;
  scoreSnapshot?: AgentScoreSnapshot;
}

export class ObserverService {
  private readonly events: ObserverEvent[] = [];

  record(event: ObserverEvent): void {
    this.events.push(event);
  }

  getRecordedEvents(): ObserverEvent[] {
    return [...this.events];
  }
}
