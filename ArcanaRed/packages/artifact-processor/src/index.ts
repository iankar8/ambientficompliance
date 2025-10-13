import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import {
  EvidenceBundleManifest,
  EvidenceBundleFile,
  ExportJobResult,
  RecordedArtifact
} from '@arcanared/shared';

export interface ArtifactProcessorInput {
  runId: string;
  workflow: string;
  artifacts: RecordedArtifact[];
}

function artifactToManifestEntry(artifact: RecordedArtifact): EvidenceBundleFile {
  try {
    const buffer = readFileSync(artifact.path);
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    const sizeBytes = buffer.length;

    return {
      path: artifact.path,
      sha256,
      sizeBytes,
      contentType: artifact.contentType ?? 'application/octet-stream'
    };
  } catch (error) {
    const fallbackHash = createHash('sha256').update(artifact.path).digest('hex');
    return {
      path: artifact.path,
      sha256: fallbackHash,
      sizeBytes: 0,
      contentType: artifact.contentType ?? 'application/octet-stream'
    };
  }
}

export class ArtifactProcessor {
  process(input: ArtifactProcessorInput): ExportJobResult {
    const files = input.artifacts.map(artifactToManifestEntry);
    const manifest: EvidenceBundleManifest = {
      runId: input.runId,
      workflow: input.workflow,
      createdAt: new Date().toISOString(),
      files,
      bundleSha256: createHash('sha256')
        .update(files.map((file) => file.sha256).join(''))
        .digest('hex')
    };

    return {
      bundlePath: `tmp/${input.runId}/exploit_bundle.zip`,
      manifest
    };
  }
}
