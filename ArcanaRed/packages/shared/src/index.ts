export type UUID = string;

export interface RunMetadata {
  id: UUID;
  customerId: string;
  workflow: string;
  persona: string;
  startedAt: string; // ISO timestamp
  finishedAt?: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  score?: number;
  patternLabel?: string;
  bundleUrl?: string;
  bundleSha256?: string;
}

export interface StepRecord {
  id: UUID;
  runId: UUID;
  index: number;
  timestamp: string;
  state: string;
  action: string;
  selector?: string;
  result: 'success' | 'retry' | 'failure';
  scoreDelta?: number;
  redacted: boolean;
}

export type ArtifactType =
  | 'har'
  | 'dom'
  | 'video'
  | 'trace'
  | 'signals'
  | 'mitigation'
  | 'rationale'
  | 'manifest';

export interface ArtifactRecord {
  runId: UUID;
  type: ArtifactType;
  url: string;
  sha256: string;
  sizeBytes: number;
}

export interface AccessLogEntry {
  artifactId: UUID;
  actorId: string;
  timestamp: string;
  ipAddress: string;
  success: boolean;
}

export interface AgentSignalContribution {
  name: string;
  value: number;
  weight: number;
  rationale: string;
}

export interface AgentScoreSnapshot {
  runId: UUID;
  stepIndex: number;
  score: number;
  topContributors: AgentSignalContribution[];
}

export interface EvidenceBundleFile {
  path: string;
  sha256: string;
  sizeBytes: number;
  contentType: string;
}

export interface EvidenceBundleManifest {
  runId: UUID;
  workflow: string;
  createdAt: string;
  files: EvidenceBundleFile[];
  bundleSha256: string;
}

export interface ExplorerActionEvent {
  timestamp: string;
  state: string;
  selector: string;
  action: string;
  params?: Record<string, unknown>;
  result?: string;
  redactionsApplied: string[];
}

export interface ExplorerTrace {
  runId: UUID;
  workflow: string;
  goal: string;
  events: ExplorerActionEvent[];
  domSnapshots: string[];
  harArchivePath?: string;
  artifacts: RecordedArtifact[];
}

export type RecordedArtifactType = 'screenshot' | 'har' | 'dom_snapshot' | 'log' | 'other';

export interface RecordedArtifact {
  type: RecordedArtifactType;
  path: string;
  contentType?: string;
  description?: string;
}

export interface WorkflowStateTransition {
  state: string;
  action: string;
  selector: string;
  nextState: string;
  guard?: string;
  params?: Record<string, unknown>;
}

export interface WorkflowDslDocument {
  runId: UUID;
  workflow: string;
  version: string;
  states: string[];
  transitions: WorkflowStateTransition[];
  createdAt: string;
}

export interface ExportJobResult {
  bundlePath: string;
  manifest: EvidenceBundleManifest;
}
