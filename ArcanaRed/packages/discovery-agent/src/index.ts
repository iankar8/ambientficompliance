import { ExplorerService, AnthropicComputerUseClient } from '@arcanared/explorer-service';
import { PlaywrightToolExecutor } from '@arcanared/tool-executor-playwright';
import { WORKFLOW_INTENTS } from '@arcanared/explorer-service';
import * as fs from 'fs';
import * as path from 'path';

export interface DiscoveryConfig {
  targetUrl: string;
  workflowType: 'zelle_send' | 'wire_transfer' | 'ach_payment' | 'login' | 'custom';
  credentials: {
    username: string;
    password: string;
  };
  outputPath: string;
  customGoals?: string[];
  recordVideo?: boolean;
  captureScreenshots?: boolean;
}

export interface DiscoveryResult {
  runId: string;
  workflowType: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  
  trace: {
    events: any[];
    finalState: string;
    success: boolean;
    errors: string[];
  };
  
  artifacts: {
    videoPath?: string;
    screenshotPaths: string[];
    tracePath: string;
    harPath?: string;
  };
  
  metadata: {
    targetUrl: string;
    statesVisited: string[];
    actionsPerformed: number;
    apiCallsMade: number;
  };
}

export class DiscoveryAgent {
  private config: DiscoveryConfig;
  private runId: string;
  private outputDir: string;

  constructor(config: DiscoveryConfig) {
    this.config = config;
    this.runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.outputDir = path.join(config.outputPath, this.runId);
    
    // Create output directories
    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.mkdirSync(path.join(this.outputDir, 'screenshots'), { recursive: true });
    fs.mkdirSync(path.join(this.outputDir, 'videos'), { recursive: true });
    fs.mkdirSync(path.join(this.outputDir, 'traces'), { recursive: true });
  }

  async discover(): Promise<DiscoveryResult> {
    const startTime = Date.now();
    console.log(`🔍 Starting discovery: ${this.config.workflowType}`);
    console.log(`📁 Output: ${this.outputDir}`);

    try {
      // Setup Playwright executor with recording
      const executor = new PlaywrightToolExecutor({
        captureDom: true,
        screenshotDirectory: path.join(this.outputDir, 'screenshots'),
        launchOptions: {
          headless: false,
          slowMo: 100 // Slight delay for better recording
        }
      });

      // Get workflow intent
      const intent = this.getWorkflowIntent();
      
      // Create explorer with smart navigation
      const explorer = new ExplorerService(
        {
          workflow: this.config.workflowType,
          goal: intent.description || intent.goals.join(', '),
          allowlistSelectors: [] // Smart navigation doesn't need allowlist
        },
        new AnthropicComputerUseClient({
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
          apiKey: process.env.ANTHROPIC_API_KEY!,
          systemPrompt: `You are an ArcanaRed security testing agent. Your goal is to ${intent.description || intent.goals.join(', ')}. Navigate efficiently and complete the workflow.`,
          maxTokens: 4096,
          maxSteps: 25,
          toolExecutor: executor
        })
      );

      // Run exploration
      console.log('🤖 Agent exploring workflow...');
      const { trace, errors } = await explorer.run();
      const traceArray = Array.isArray(trace) ? trace : [];

      // Save trace
      const tracePath = path.join(this.outputDir, 'traces', 'trace.json');
      fs.writeFileSync(tracePath, JSON.stringify(trace, null, 2));

      // Get video path
      const videoPath = await this.findVideoFile();

      // Collect screenshots
      const screenshotPaths = this.collectScreenshots();

      const endTime = Date.now();
      const durationMs = endTime - startTime;

      const result: DiscoveryResult = {
        runId: this.runId,
        workflowType: this.config.workflowType,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date(endTime).toISOString(),
        durationMs,
        trace: {
          events: traceArray,
          finalState: this.extractFinalState(traceArray),
          success: errors.length === 0,
          errors
        },
        artifacts: {
          videoPath,
          screenshotPaths,
          tracePath
        },
        metadata: {
          targetUrl: this.config.targetUrl,
          statesVisited: this.extractStates(traceArray),
          actionsPerformed: traceArray.length,
          apiCallsMade: 0
        }
      };

      // Save result summary
      fs.writeFileSync(
        path.join(this.outputDir, 'result.json'),
        JSON.stringify(result, null, 2)
      );

      console.log(`✅ Discovery complete in ${(durationMs / 1000).toFixed(1)}s`);
      console.log(`📹 Video: ${videoPath || 'N/A'}`);
      console.log(`📸 Screenshots: ${screenshotPaths.length}`);

      await executor.dispose();
      return result;

    } catch (error) {
      console.error('❌ Discovery failed:', error);
      throw error;
    }
  }

  private getWorkflowIntent() {
    const { targetUrl, credentials, customGoals } = this.config;

    if (customGoals) {
      return {
        name: 'Custom Workflow',
        goals: customGoals,
        description: customGoals.join(', ')
      };
    }

    // Use predefined intents
    switch (this.config.workflowType) {
      case 'zelle_send':
        return WORKFLOW_INTENTS.zellePayment(targetUrl, credentials);
      case 'wire_transfer':
        return {
          name: 'Wire Transfer',
          goals: [
            'Authenticate with credentials',
            'Navigate to wire transfer section',
            'Enter recipient details and amount',
            'Submit wire transfer',
            'Verify confirmation'
          ],
          description: 'Complete a wire transfer workflow'
        };
      case 'ach_payment':
        return {
          name: 'ACH Payment',
          goals: [
            'Authenticate user',
            'Navigate to ACH payment',
            'Enter payment details',
            'Submit payment',
            'Verify success'
          ],
          description: 'Complete an ACH payment'
        };
      case 'login':
        return {
          name: 'Login Flow',
          goals: [
            'Navigate to login page',
            'Enter credentials',
            'Submit login',
            'Verify authenticated state'
          ],
          description: 'Test authentication flow'
        };
      default:
        throw new Error(`Unknown workflow type: ${this.config.workflowType}`);
    }
  }

  private async findVideoFile(): Promise<string | undefined> {
    const videosDir = path.join(this.outputDir, 'videos');
    try {
      const files = fs.readdirSync(videosDir);
      const videoFile = files.find(f => f.endsWith('.webm'));
      return videoFile ? path.join(videosDir, videoFile) : undefined;
    } catch {
      return undefined;
    }
  }

  private collectScreenshots(): string[] {
    const screenshotsDir = path.join(this.outputDir, 'screenshots');
    try {
      const files = fs.readdirSync(screenshotsDir);
      return files
        .filter(f => f.endsWith('.png'))
        .map(f => path.join(screenshotsDir, f))
        .sort();
    } catch {
      return [];
    }
  }

  private extractFinalState(trace: any): string {
    if (!trace || trace.length === 0) return 'unknown';
    const lastEvent = trace[trace.length - 1];
    return lastEvent?.state || 'completed';
  }

  private extractStates(trace: any): string[] {
    if (!trace) return [];
    const states = new Set<string>();
    trace.forEach((event: any) => {
      if (event.state) states.add(event.state);
    });
    return Array.from(states);
  }
}

export { WORKFLOW_INTENTS } from '@arcanared/explorer-service';
