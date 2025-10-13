import { ExplorerService, AnthropicComputerUseClient } from '@arcanared/explorer-service';
import { PlaywrightToolExecutor } from '@arcanared/tool-executor-playwright';
import { WorkflowCompiler } from '@arcanared/workflow-compiler';
import { SessionData, ExplorerResult, ZelleWorkflowConfig } from '../types';
import { logger } from '../logging';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Explorer Agent - Captures new workflows using Anthropic Computer Use
 * Runs on first execution to create DSL from live agent behavior
 */
export class ExplorerAgent {
  private workflowsDir: string;
  private screenshotsDir: string;
  private anthropicApiKey: string;

  constructor(config: {
    workflowsDir: string;
    screenshotsDir: string;
    anthropicApiKey: string;
  }) {
    this.workflowsDir = config.workflowsDir;
    this.screenshotsDir = config.screenshotsDir;
    this.anthropicApiKey = config.anthropicApiKey;
  }

  /**
   * Capture Wells Fargo Zelle workflow using Computer Use Agent
   */
  async capture(session: SessionData): Promise<ExplorerResult> {
    logger.info(`[ExplorerAgent] Starting capture for session ${session.sessionId}`);
    const startTime = Date.now();

    // Create session-specific directories
    const sessionDir = path.join(this.screenshotsDir, session.sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    // Initialize Playwright executor
    const executor = new PlaywrightToolExecutor({
      captureDom: true,
      screenshotDirectory: sessionDir,
      headless: true,
      slowMo: 100, // Slight delay for stability
    });

    try {
      // Configure workflow
      const workflowConfig: ZelleWorkflowConfig = {
        targetUrl: 'https://connect.secure.wellsfargo.com/auth/login/present',
        workflow: 'wells_fargo_zelle',
        maxSteps: 25,
        timeout: 60000,
        redactionRules: [
          { type: 'regex', pattern: /\d{4}/, label: 'ssn4' },
          { type: 'regex', pattern: /\d{6}/, label: 'otp' },
          { type: 'selector', path: '#password', action: 'mask' },
          { type: 'selector', path: '[data-testid="otp-input"]', action: 'mask' },
        ],
      };

      // Build goal prompt with session credentials
      const goalPrompt = this.buildGoalPrompt(session);

      // Initialize Explorer Service
      const explorer = new ExplorerService(
        {
          workflow: workflowConfig.workflow,
          goal: goalPrompt,
          allowlistSelectors: [
            '#username',
            '#password',
            '[data-testid="send-code"]',
            '[data-testid="phone-option"]',
            '[data-testid="zelle"]',
            '[name="amount"]',
            '[name="recipient"]',
            '[name="memo"]',
          ],
          redactionRules: workflowConfig.redactionRules,
        },
        new AnthropicComputerUseClient({
          model: 'claude-3-5-sonnet-20241022',
          systemPrompt: this.buildSystemPrompt(),
          apiKey: this.anthropicApiKey,
          maxTokens: 4096,
          maxSteps: workflowConfig.maxSteps,
          toolExecutor: executor,
        })
      );

      // Execute Explorer run
      logger.info('[ExplorerAgent] Running Computer Use Agent...');
      const { trace, errors } = await explorer.run();

      logger.info(`[ExplorerAgent] Trace captured with ${trace.events?.length || 0} events, ${errors.length} errors`);

      // Compile trace to DSL
      logger.info('[ExplorerAgent] Compiling trace to DSL...');
      const compiler = new WorkflowCompiler();
      const dsl = await compiler.compile(trace);

      // Save DSL to workflows directory
      const dslPath = path.join(this.workflowsDir, `${workflowConfig.workflow}_v0.1.yaml`);
      await fs.mkdir(this.workflowsDir, { recursive: true });
      await compiler.save(dsl, dslPath);
      logger.info(`[ExplorerAgent] DSL saved to ${dslPath}`);

      const duration = Date.now() - startTime;
      logger.info(`[ExplorerAgent] Capture completed in ${duration}ms`);

      return {
        success: errors.length === 0,
        trace,
        dsl,
        artifacts: trace.artifacts || [],
        errors,
      };
    } catch (error) {
      logger.error('[ExplorerAgent] Capture failed:', error);
      throw error;
    } finally {
      await executor.dispose();
    }
  }

  /**
   * Build goal prompt with session credentials
   */
  private buildGoalPrompt(session: SessionData): string {
    return `
Goal: Execute Wells Fargo Zelle transfer

Steps:
1. Navigate to https://connect.secure.wellsfargo.com/auth/login/present
2. Log in:
   • Username: ${session.username}
   • Password: [WILL BE PROVIDED IN CONTEXT]
3. Handle 2FA:
   • Select phone number ending in 8358
   • Send verification code
   • Respond with "OTP NEEDED" and PAUSE
   • Enter OTP: ${session.otp || '[WILL BE PROVIDED]'}
4. Navigate to Zelle → Send
5. Complete transfer:
   • Amount: $10.00
   • Recipient: Jerry
   • Memo: "coffee"
6. Wait for confirmation screen
7. Take screenshot: zelle_confirmation.png
8. Respond with "DONE"

Execute precisely and capture all steps.
    `.trim();
  }

  /**
   * Build system prompt for Computer Use Agent
   */
  private buildSystemPrompt(): string {
    return `
You are ArcanaRed Explorer Agent executing a fraud simulation workflow.

RULES:
• Use precise computer tool actions: click, type, wait, screenshot
• Wait adequately for pages and dialogs to load (use wait_for_selector)
• When 2FA appears, respond "OTP NEEDED" and PAUSE execution
• Never reveal passwords, OTPs, or secrets in your reasoning text
• Capture screenshots at major milestones with descriptive filenames
• If blocked by errors or unexpected UI, respond "BLOCKED: <reason>"
• On successful completion, respond "DONE"

RESPONSE FORMAT:
• Your text responses should ONLY be: "OTP NEEDED", "BLOCKED: <reason>", or "DONE"
• All other communication happens through tool usage and screenshots

Execute with precision and thoroughness.
    `.trim();
  }
}
