import path from 'path';
import {
  AnthropicComputerUseClient,
  ExplorerService,
  ToolExecutor
} from '@arcanared/explorer-service';
import {
  SemanticWorkflowBuilder,
  WORKFLOW_INTENTS
} from '@arcanared/explorer-service/src/semantic-workflow';
import {
  SMART_DISCOVERY_TOOLS,
  SMART_NAVIGATION_SYSTEM_PROMPT
} from '@arcanared/explorer-service/src/smart-selector';
import {
  WorkflowStateInference,
  generateStateInferenceGuidance
} from '@arcanared/explorer-service/src/state-inference';
import { WorkflowCompiler } from '@arcanared/workflow-compiler';
import { RunnerService } from '@arcanared/runner-service';
import { ArtifactProcessor } from '@arcanared/artifact-processor';
import { AgentScoreService } from '@arcanared/score-service';
import { PolicyEngine } from '@arcanared/policy-engine';
import { ExporterService } from '@arcanared/exporter-service';
import { ObserverService } from '@arcanared/observer-service';
import { PipelineCoordinator } from './index';
import { PlaywrightToolExecutor } from '@arcanared/tool-executor-playwright';

/**
 * Smart CLI - Uses semantic workflows and intelligent navigation
 * 
 * Key improvements:
 * 1. No hardcoded step-by-step instructions
 * 2. Goal-oriented workflow descriptions
 * 3. Intelligent selector discovery
 * 4. Automatic state inference
 */

async function main() {
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022';
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY required for smart navigation mode');
    process.exit(1);
  }

  const artifactRoot = path.join(process.cwd(), 'tmp', 'explorer-artifacts');
  const baseUrl = process.env.DEMO_BANK_BASE_URL ?? 'http://localhost:4000';
  const workflowType = process.env.WORKFLOW_TYPE ?? 'zelle_payment';

  // Initialize smart components
  const semanticBuilder = new SemanticWorkflowBuilder();
  const stateInference = new WorkflowStateInference();

  // Build workflow intent (no hardcoded steps!)
  const workflowIntent = WORKFLOW_INTENTS.zellePayment(baseUrl, {
    username: process.env.DEMO_BANK_USERNAME ?? 'demouser',
    password: process.env.DEMO_BANK_PASSWORD ?? 'Demo1234!'
  });

  // Generate intelligent prompt
  const semanticPrompt = semanticBuilder.buildPrompt(workflowIntent);
  const stateGuidance = generateStateInferenceGuidance();

  console.log('🧠 Smart Navigation Mode Activated');
  console.log(`📋 Workflow: ${workflowIntent.name}`);
  console.log(`🎯 Goals: ${workflowIntent.goals.length} objectives`);
  console.log('');

  // Configure explorer with smart tools
  const explorer = new ExplorerService(
    {
      workflow: workflowType,
      goal: workflowIntent.description,
      // Minimal allowlist - agent discovers elements semantically
      allowlistSelectors: ['browser', '*[data-testid]', '*[role]', 'button', 'input', 'select', 'a'],
      redactionRules: [
        { name: 'email', pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, replacement: '***@***' },
        { name: 'digits', pattern: /\d{4,}/g, replacement: '####' }
      ]
    },
    new AnthropicComputerUseClient({
      model,
      apiKey,
      systemPrompt: SMART_NAVIGATION_SYSTEM_PROMPT,
      maxTokens: Number(process.env.EXPLORER_MAX_TOKENS ?? 4096), // More tokens for reasoning
      maxSteps: Number(process.env.EXPLORER_MAX_STEPS ?? 30),
      tools: SMART_DISCOVERY_TOOLS,
      toolChoice: { type: 'auto' }, // Let agent decide when to use tools
      toolExecutor: new PlaywrightToolExecutor({
        screenshotDirectory: path.join(artifactRoot, 'explorer-screenshots'),
        launchOptions: { headless: process.env.HEADLESS !== 'false' }
      }),
      conversationPreamble: [
        {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: `I understand. I will use semantic discovery and state inference to complete workflows intelligently.

${stateGuidance}

I'm ready to begin.`
            }
          ]
        }
      ],
      userMessageBuilder: () => [
        {
          type: 'text',
          text: semanticPrompt
        }
      ]
    })
  );

  // Set up pipeline (same as before)
  const coordinator = new PipelineCoordinator({
    explorer,
    compiler: new WorkflowCompiler(),
    runner: new RunnerService({
      executor: new PlaywrightToolExecutor({
        screenshotDirectory: path.join(artifactRoot, 'runner-screenshots'),
        launchOptions: { headless: true }
      }),
      artifactRoot
    }),
    artifactProcessor: new ArtifactProcessor(),
    scoreService: new AgentScoreService(),
    policyEngine: new PolicyEngine([{ threshold: 70, action: 'review' }]),
    exporter: new ExporterService(),
    observer: new ObserverService()
  });

  // Execute workflow
  console.log('🚀 Starting intelligent exploration...\n');
  const startTime = Date.now();
  
  try {
    const summary = await coordinator.execute(workflowType);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n✅ Workflow completed successfully');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📊 Score: ${summary.scoreTimeline[summary.scoreTimeline.length - 1]?.score ?? 0}`);
    console.log(`🎬 Actions: ${summary.trace.events.length}`);
    console.log(`📁 Artifacts: ${summary.trace.artifacts.length}`);
    console.log('');
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error('\n❌ Workflow failed');
    console.error(`⏱️  Duration: ${duration}s`);
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
