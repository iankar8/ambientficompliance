import path from 'path';
import {
  AnthropicComputerUseClient,
  ExplorerService,
  MockComputerUseClient,
  ToolExecutor,
  ToolExecutionContext,
  ToolExecutionResult
} from '@arcanared/explorer-service';
import { WorkflowCompiler } from '@arcanared/workflow-compiler';
import { RunnerService } from '@arcanared/runner-service';
import { ArtifactProcessor } from '@arcanared/artifact-processor';
import { AgentScoreService } from '@arcanared/score-service';
import { PolicyEngine } from '@arcanared/policy-engine';
import { ExporterService } from '@arcanared/exporter-service';
import { ObserverService } from '@arcanared/observer-service';
import { PipelineCoordinator } from './index';
import { PlaywrightToolExecutor } from '@arcanared/tool-executor-playwright';

class MockToolExecutor implements ToolExecutor {
  async execute(context: ToolExecutionContext): Promise<ToolExecutionResult> {
    return {
      events: [
        {
          type: 'dom_snapshot',
          timestamp: new Date().toISOString(),
          html: `<div data-step="${context.step}">Mock DOM snapshot</div>`
        }
      ],
      toolResult: {
        type: 'tool_result',
        tool_use_id: context.toolUse.id,
        content: 'mock-success',
        is_error: false
      }
    };
  }
}

async function main() {
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022';
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const useMock = !apiKey || process.env.USE_MOCK_PIPELINE === 'true';
  if (useMock) {
    console.log('Running pipeline in MOCK mode (no Anthropic API key provided).');
  }

  const artifactRoot = path.join(process.cwd(), 'tmp', 'explorer-artifacts');

  const workflow = process.env.EXPLORER_WORKFLOW ?? 'zelle_send';
  const goal = process.env.EXPLORER_GOAL ?? 'Execute target workflow end-to-end';
  const baseUrl = process.env.DEMO_BANK_BASE_URL ?? 'http://localhost:4000';
  const demoUsername = process.env.DEMO_BANK_USERNAME ?? 'demouser';
  const demoPassword = process.env.DEMO_BANK_PASSWORD ?? 'Demo1234!';

  const explorerConfig = {
    workflow,
    goal,
    allowlistSelectors: [
      'browser',
      '#username',
      '#password',
      'button[data-testid="login-submit"]',
      'a[data-testid="forgot-password-link"]',
      'a[data-testid="start-zelle-button"]',
      'a[data-testid="nav-zelle"]',
      'select#recipientId',
      'input#amount',
      'input#note',
      'button[data-testid="zelle-submit"]',
      'button[data-testid="logout-button"]'
    ],
    redactionRules: [
      {
        name: 'email',
        pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
        replacement: '***@***'
      },
      {
        name: 'digits',
        pattern: /\d{4,}/g,
        replacement: '####'
      }
    ]
  };

  const explorer = new ExplorerService(
    explorerConfig,
    useMock
      ? new MockComputerUseClient([
          {
            type: 'action',
            timestamp: new Date().toISOString(),
            state: 'login',
            selector: '#username',
            action: 'type',
            params: { value: 'mock-user' }
          },
          {
            type: 'action',
            timestamp: new Date().toISOString(),
            state: 'login',
            selector: '#password',
            action: 'type',
            params: { value: 'mock-pass' }
          },
          {
            type: 'action',
            timestamp: new Date().toISOString(),
            state: 'login',
            selector: '#submit',
            action: 'click'
          },
          {
            type: 'dom_snapshot',
            timestamp: new Date().toISOString(),
            html: '<div id="mock">Mock DOM after submit</div>'
          },
          {
            type: 'artifact',
            timestamp: new Date().toISOString(),
            artifactType: 'screenshot',
            path: 'mock://screenshot',
            description: 'Mock screenshot'
          }
        ])
      : new AnthropicComputerUseClient({
          model,
          systemPrompt:
            process.env.EXPLORER_SYSTEM_PROMPT ??
            `You are ArcanaRed Explorer, an automated workflow executor.

CRITICAL RULES:
1. You MUST call record_action for EVERY single action (navigate, click, type, select).
2. Execute ONE action at a time using record_action, then wait for the result.
3. After receiving a tool result, immediately call record_action for the NEXT action.
4. Continue calling record_action until all workflow steps are complete.
5. Include accurate state, selector, action, and params in every record_action call.
6. If a selector is not in the allowlist or a step fails, call record_action with an error result and stop.
7. Do NOT provide explanations or summaries—only call record_action repeatedly.`,
          apiKey,
          maxTokens: Number(process.env.EXPLORER_MAX_TOKENS ?? 2048),
          maxSteps: Number(process.env.EXPLORER_MAX_STEPS ?? 25),
          // No toolExecutor = NoopToolExecutor (fast, no browser execution during exploration)
          // Explorer just collects action calls, Runner executes them later
          conversationPreamble: [
            {
              role: 'assistant',
              content: [
                {
                  type: 'text',
                  text: `Environment instructions:\n- Base URL: ${baseUrl}\n- Workflow states: login_form -> dashboard -> zelle_form -> confirmation\n- Credentials: username ${demoUsername}, password ${demoPassword}\n- Selectors: #username, #password, button[data-testid=\\"login-submit\\"], a[data-testid=\\"start-zelle-button\\"], select#recipientId, input#amount, input#note, button[data-testid=\\"zelle-submit\\"], button[data-testid=\\"logout-button\\"].\n- Always use record_action with params: for navigate include { url }, for type include { value }, for click include { url or description }, for select include { value }.\n- Guardrails: stay within ${baseUrl}. If CAPTCHA or unexpected error occurs, emit an error event and stop.\n- Log each major transition with state labels.`
                }
              ]
            }
          ],
          userMessageBuilder: () => [
            {
              type: 'text',
              text: `Begin the workflow by calling record_action to navigate to ${baseUrl}/login. After each successful tool result, call record_action again for the next step:
1. navigate to ${baseUrl}/login (state: "initial", action: "navigate", params: { url: "${baseUrl}/login" })
2. type "${demoUsername}" into #username (state: "login_form", action: "type", selector: "#username", params: { value: "${demoUsername}" })
3. type password into #password (state: "login_form", action: "type", selector: "#password", params: { value: "${demoPassword}" })
4. click button[data-testid="login-submit"] (state: "login_form", action: "click")
5. click a[data-testid="start-zelle-button"] (state: "dashboard", action: "click")
6. select first recipient in select#recipientId (state: "zelle_form", action: "select", params: { value: "rec-001" })
7. type "25.00" into input#amount (state: "zelle_form", action: "type", params: { value: "25.00" })
8. type "Weekly allowance" into input#note (state: "zelle_form", action: "type", params: { value: "Weekly allowance" })
9. click button[data-testid="zelle-submit"] (state: "zelle_form", action: "click")
10. verify success (state: "confirmation", action: "record_action", result: "workflow complete")

Start now with step 1.`
            }
          ]
        })
  );

  const runnerExecutor: ToolExecutor | undefined = useMock
    ? new MockToolExecutor()
    : new PlaywrightToolExecutor({
        screenshotDirectory: path.join(artifactRoot, 'runner-screenshots'),
        launchOptions: { headless: true }
      });

  const coordinator = new PipelineCoordinator({
    explorer,
    compiler: new WorkflowCompiler(),
    runner: new RunnerService({
      executor: runnerExecutor,
      artifactRoot
    }),
    artifactProcessor: new ArtifactProcessor(),
    scoreService: new AgentScoreService(),
    policyEngine: new PolicyEngine([{ threshold: 70, action: 'review' }]),
    exporter: new ExporterService(),
    observer: new ObserverService()
  });

  const summary = await coordinator.execute(workflow);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
