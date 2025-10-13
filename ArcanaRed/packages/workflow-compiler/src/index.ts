import { WorkflowDslDocument, ExplorerTrace, WorkflowStateTransition } from '@arcanared/shared';

export class WorkflowCompiler {
  constructor(private readonly workflowVersion: string = 'v0.1') {}

  compile(trace: ExplorerTrace): WorkflowDslDocument {
    const states = new Set<string>();
    const transitions: WorkflowStateTransition[] = [];

    trace.events.forEach((event, index) => {
      const currentState = event.state || `state_${index}`;
      const nextState = trace.events[index + 1]?.state ?? 'terminal';

      states.add(currentState);
      states.add(nextState);

      transitions.push({
        state: currentState,
        action: event.action,
        selector: event.selector,
        nextState
      });
    });

    return {
      runId: trace.runId,
      workflow: trace.workflow,
      version: this.workflowVersion,
      states: Array.from(states),
      transitions,
      createdAt: new Date().toISOString()
    };
  }
}
