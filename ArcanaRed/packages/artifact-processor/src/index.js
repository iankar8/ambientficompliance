"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtifactProcessor = void 0;
const crypto_1 = require("crypto");
function hashPlaceholder(path) {
    const sha256 = (0, crypto_1.createHash)('sha256').update(path).digest('hex');
    return {
        path,
        sha256,
        sizeBytes: 0,
        contentType: 'application/octet-stream'
    };
}
class ArtifactProcessor {
    process(input) {
        const files = input.artifactPaths.map(hashPlaceholder);
        const manifest = {
            runId: input.runId,
            workflow: input.workflow,
            createdAt: new Date().toISOString(),
            files,
            bundleSha256: (0, crypto_1.createHash)('sha256')
                .update(files.map((file) => file.sha256).join(''))
                .digest('hex')
        };
        return {
            bundlePath: `tmp/${input.runId}/exploit_bundle.zip`,
            manifest
        };
    }
}
exports.ArtifactProcessor = ArtifactProcessor;
