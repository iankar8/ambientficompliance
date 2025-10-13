"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyEngine = void 0;
class PolicyEngine {
    rules;
    constructor(rules) {
        this.rules = rules;
    }
    evaluate(snapshot) {
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
exports.PolicyEngine = PolicyEngine;
