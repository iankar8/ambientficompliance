import { EvidenceBundleManifest, ExportJobResult } from '@arcanared/shared';

export interface ExportRequest {
  runId: string;
  workflow: string;
  bundlePath: string;
  manifest?: EvidenceBundleManifest;
}

export class ExporterService {
  async export(request: ExportRequest): Promise<ExportJobResult> {
    const manifest: EvidenceBundleManifest =
      request.manifest ?? {
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
