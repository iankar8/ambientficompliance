"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunnerService = void 0;
const crypto_1 = require("crypto");
class RunnerService {
    async execute(dsl) {
        const runId = dsl.runId ?? (0, crypto_1.randomUUID)();
        const steps = dsl.transitions.map((transition, index) => ({
            id: (0, crypto_1.randomUUID)(),
            runId,
            index,
            timestamp: new Date().toISOString(),
            state: transition.state,
            action: transition.action,
            selector: transition.selector,
            result: 'failure',
            redacted: false
        }));
        return {
            runId,
            steps,
            artifacts: [],
            errors: ['Runner integration pending']
        };
    }
}
exports.RunnerService = RunnerService;
