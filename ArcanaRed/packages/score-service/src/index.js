"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentScoreService = void 0;
class AgentScoreService {
    context;
    constructor(context = {}) {
        this.context = context;
    }
    computeScore(runId, steps) {
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
exports.AgentScoreService = AgentScoreService;
