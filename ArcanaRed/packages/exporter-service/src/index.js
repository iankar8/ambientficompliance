"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExporterService = void 0;
class ExporterService {
    async export(request) {
        const manifest = request.manifest ?? {
            runId: request.runId,
            workflow: request.workflow,
            createdAt: new Date().toISOString(),
            files: [],
            bundleSha256: ''
        };
        return {
            bundlePath: request.bundlePath,
            manifest
        };
    }
}
exports.ExporterService = ExporterService;
