/**
 * Multi-Agent System Types for Zelle Workflow
 */

export interface SessionData {
  sessionId: string;
  username: string;
  password: string;
  otp?: string;
  dob?: string;
  ssn4?: string;
}

export interface ExplorerResult {
  success: boolean;
  trace: any;
  dsl?: any;
  artifacts: Array<{
    type: string;
    path: string;
    contentType: string;
  }>;
  errors: Array<{ message: string; step?: number }>;
}

export interface RunResult {
  success: boolean;
  bundleUrl?: string;
  metrics: {
    duration: number;
    timings: Record<string, number>;
    actions: Array<{ action: string; timestamp: number; success: boolean }>;
    device?: Record<string, any>;
    network?: Record<string, any>;
  };
  screenshots: string[];
  domSnapshots?: string[];
  har?: string;
  trace?: any;
}

export interface AgentScore {
  value: number;
  signals: Array<{
    name: string;
    value: number;
    weight: number;
    contribution: number;
  }>;
  rationale: string;
  recommendation: 'ALLOW' | 'REVIEW' | 'BLOCK';
}

export interface OrchestratorConfig {
  redisUrl: string;
  anthropicApiKey: string;
  workflowsDir: string;
  artifactsDir: string;
  screenshotsDir: string;
  maxExecutionTime: number; // ms
  enableExplorer: boolean;
  enableScoring: boolean;
}

export interface ZelleWorkflowConfig {
  targetUrl: string;
  workflow: string;
  maxSteps: number;
  timeout: number;
  redactionRules: Array<{
    type: 'regex' | 'selector';
    pattern?: RegExp;
    path?: string;
    action?: 'mask' | 'remove';
    label?: string;
  }>;
}
