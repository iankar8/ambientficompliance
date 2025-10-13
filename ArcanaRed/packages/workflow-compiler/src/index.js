"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowCompiler = void 0;
class WorkflowCompiler {
    workflowVersion;
    constructor(workflowVersion = 'v0.1') {
        this.workflowVersion = workflowVersion;
    }
    compile(trace) {
        const states = new Set();
        const transitions = [];
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
exports.WorkflowCompiler = WorkflowCompiler;
