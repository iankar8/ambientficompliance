import { randomUUID } from 'crypto';
import { Anthropic } from '@anthropic-ai/sdk';
import type {
  MessageParam as AnthropicMessageParam,
  Tool as AnthropicTool,
  ToolChoice as AnthropicToolChoice,
  ToolResultBlockParam as AnthropicToolResultBlockParam,
  ToolUseBlock as AnthropicToolUseBlock,
  RawMessageStreamEvent as AnthropicRawMessageStreamEvent
} from '@anthropic-ai/sdk/resources/messages';
import {
  ExplorerTrace,
  ExplorerActionEvent,
  RecordedArtifactType
} from '@arcanared/shared';

const DEBUG_LOGS_ENABLED = process.env.EXPLORER_DEBUG_LOGS === 'true';

function debugLog(message: string, ...rest: unknown[]): void {
  if (!DEBUG_LOGS_ENABLED) return;
  // eslint-disable-next-line no-console
  console.log(`[explorer-debug] ${message}`, ...rest);
}

export type RedactionRule = {
  name: string;
  pattern: RegExp;
  replacement?: string;
};

export interface ExplorerConfig {
  workflow: string;
  goal: string;
  allowlistSelectors?: string[];
  redactionRules?: RedactionRule[];
  captureDomSnapshots?: boolean;
  captureHar?: boolean;
}

export interface ExplorerResult {
  trace: ExplorerTrace;
  errors: string[];
}

export interface ComputerUseSessionInput {
  workflow: string;
  goal: string;
}

export type ComputerUseEvent =
  | {
      type: 'action';
      timestamp: string;
      state: string;
      selector: string;
      action: string;
      params?: Record<string, unknown>;
      result?: string;
    }
  | { type: 'dom_snapshot'; timestamp: string; html: string }
  | { type: 'network_har'; timestamp: string; path: string }
  | { type: 'log'; timestamp: string; level: 'info' | 'warn' | 'error'; message: string }
  | { type: 'artifact'; timestamp: string; artifactType: RecordedArtifactType; path: string; contentType?: string; description?: string }
  | { type: 'error'; timestamp: string; error: string }
  | { type: 'end'; timestamp: string };

export interface ComputerUseClient {
  runSession(input: ComputerUseSessionInput): AsyncIterable<ComputerUseEvent>;
}

export class ExplorerService {
  private readonly allowlistSelectors: Set<string>;

  constructor(
    private readonly config: ExplorerConfig,
    private readonly client: ComputerUseClient
  ) {
    this.allowlistSelectors = new Set(config.allowlistSelectors ?? []);
  }

  async run(): Promise<ExplorerResult> {
    const runId = randomUUID();
    const trace: ExplorerTrace = {
      runId,
      workflow: this.config.workflow,
      goal: this.config.goal,
      events: [],
      domSnapshots: [],
      harArchivePath: undefined,
      artifacts: []
    };
    const errors: string[] = [];

    try {
      for await (const event of this.client.runSession({
        workflow: this.config.workflow,
        goal: this.config.goal
      })) {
        switch (event.type) {
          case 'action': {
            if (
              this.allowlistSelectors.size > 0 &&
              !this.allowlistSelectors.has(event.selector)
            ) {
              errors.push(`Selector not in allowlist: ${event.selector}`);
              break;
            }

            const {
              redactedValue: redactedSelector,
              redactionsApplied: selectorRedactions
            } = this.applyRedactions(event.selector);
            const {
              redactedParams,
              redactionsApplied: paramsRedactions
            } = this.redactParams(event.params ?? {});
            const actionEvent: ExplorerActionEvent = {
              timestamp: event.timestamp,
              state: event.state,
              selector: redactedSelector,
              action: event.action,
              params: redactedParams,
              result: event.result,
              redactionsApplied: [...selectorRedactions, ...paramsRedactions]
            };
            trace.events.push(actionEvent);
            break;
          }
          case 'dom_snapshot': {
            if (this.config.captureDomSnapshots !== false) {
              const {
                redactedValue: redactedHtml
              } = this.applyRedactions(event.html);
              trace.domSnapshots.push(redactedHtml);
            }
            break;
          }
          case 'network_har': {
            if (this.config.captureHar !== false) {
              trace.harArchivePath = event.path;
              trace.artifacts.push({
                type: 'har',
                path: event.path,
                contentType: 'application/json'
              });
            }
            break;
          }
          case 'artifact': {
            if (event.artifactType === 'har') {
              trace.harArchivePath = event.path;
            }
            trace.artifacts.push({
              type: event.artifactType,
              path: event.path,
              contentType: event.contentType,
              description: event.description
            });
            break;
          }
          case 'log': {
            if (event.level === 'error') {
              errors.push(event.message);
            }
            break;
          }
          case 'error': {
            errors.push(event.error);
            break;
          }
          case 'end': {
            break;
          }
          default: {
            const exhaustiveCheck: never = event;
            throw new Error(`Unhandled event type: ${JSON.stringify(exhaustiveCheck)}`);
          }
        }
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return {
      trace,
      errors
    };
  }

  private applyRedactions(value: string): {
    redactedValue: string;
    redactionsApplied: string[];
  } {
    let redactedValue = value;
    const applied: string[] = [];

    for (const rule of this.config.redactionRules ?? []) {
      if (rule.pattern.test(redactedValue)) {
        applied.push(rule.name);
        const replacement = rule.replacement ?? '***';
        redactedValue = redactedValue.replace(rule.pattern, replacement);
      }
    }

    return { redactedValue, redactionsApplied: applied };
  }

  private redactParams(params: Record<string, unknown>): {
    redactedParams: Record<string, unknown>;
    redactionsApplied: string[];
  } {
    const redactedParams: Record<string, unknown> = {};
    const applied: string[] = [];

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        const { redactedValue, redactionsApplied } = this.applyRedactions(value);
        redactedParams[key] = redactedValue;
        applied.push(...redactionsApplied.map((name) => `${key}:${name}`));
      } else {
        redactedParams[key] = value;
      }
    }

    return { redactedParams, redactionsApplied: applied };
  }
}

export class MockComputerUseClient implements ComputerUseClient {
  constructor(private readonly events: ComputerUseEvent[]) {}

  async *runSession(): AsyncIterable<ComputerUseEvent> {
    for (const event of this.events) {
      yield event;
    }
    const last = this.events.at(-1);
    if (!last || last.type !== 'end') {
      yield { type: 'end', timestamp: new Date().toISOString() };
    }
  }
}

export interface ToolExecutionContext {
  workflow: string;
  goal: string;
  step: number;
  toolUse: AnthropicToolUseBlock;
  input: Record<string, unknown>;
}

export interface ToolExecutionResult {
  events?: ComputerUseEvent[];
  toolResult?: AnthropicToolResultBlockParam | AnthropicToolResultBlockParam[] | null;
}

export interface ToolExecutor {
  execute(context: ToolExecutionContext): Promise<ToolExecutionResult>;
}

type PendingToolUse = {
  block: AnthropicToolUseBlock;
  index: number;
  jsonBuffer: string[];
  resolvedInput?: Record<string, unknown>;
};

type PendingTextBlock = {
  index: number;
  buffer: string[];
};

type ResolvedToolUse = {
  block: AnthropicToolUseBlock;
  input: Record<string, unknown>;
};

const DEFAULT_ACTION_TOOL: AnthropicTool = {
  name: 'record_action',
  description:
    'Use this tool to record concrete UI actions (click, type, select) including the DOM selector, current state, and any parameters.',
  input_schema: {
    type: 'object',
    properties: {
      state: { type: 'string' },
      selector: { type: 'string' },
      action: { type: 'string' },
      params: { type: 'object' },
      result: { type: 'string' }
    },
    required: ['action'],
    additionalProperties: true
  }
};

export interface AnthropicComputerUseClientConfig {
  model: string;
  systemPrompt: string;
  apiKey?: string;
  client?: Anthropic;
  maxTokens?: number;
  maxSteps?: number;
  tools?: AnthropicTool[];
  toolChoice?: AnthropicToolChoice;
  toolExecutor?: ToolExecutor;
  conversationPreamble?: AnthropicMessageParam[];
  userMessageBuilder?: (input: ComputerUseSessionInput) => AnthropicMessageParam['content'];
}

export class AnthropicComputerUseClient implements ComputerUseClient {
  private readonly anthropic: Anthropic;
  private readonly tools: AnthropicTool[];
  private readonly toolChoice?: AnthropicToolChoice;
  private readonly toolExecutor: ToolExecutor;
  private readonly maxTokens: number;
  private readonly maxSteps: number;
  private readonly conversationPreamble: AnthropicMessageParam[];
  private readonly userMessageBuilder?: (input: ComputerUseSessionInput) => AnthropicMessageParam['content'];

  constructor(private readonly config: AnthropicComputerUseClientConfig) {
    if (!config.client && !config.apiKey) {
      throw new Error('AnthropicComputerUseClient requires either an instantiated client or an API key');
    }
    this.anthropic = config.client ?? new Anthropic({ apiKey: config.apiKey });
    this.tools = config.tools && config.tools.length > 0 ? config.tools : [DEFAULT_ACTION_TOOL];
    this.toolChoice = config.toolChoice;
    this.toolExecutor = config.toolExecutor ?? new NoopToolExecutor();
    this.maxTokens = config.maxTokens ?? 2048;
    this.maxSteps = config.maxSteps ?? 25;
    this.conversationPreamble = config.conversationPreamble ?? [];
    this.userMessageBuilder = config.userMessageBuilder;
  }

  async *runSession(input: ComputerUseSessionInput): AsyncIterable<ComputerUseEvent> {
    const messages: AnthropicMessageParam[] = [
      ...this.conversationPreamble,
      {
        role: 'user',
        content: this.userMessageBuilder
          ? this.userMessageBuilder(input)
          : `Workflow: ${input.workflow}\nGoal: ${input.goal}`
      }
    ];

    let step = 0;
    const maxSteps = Math.max(1, this.maxSteps);

    while (step < maxSteps) {
      const effectiveToolChoice = this.toolChoice ?? (step === 0 ? { type: 'any' } : { type: 'auto' });
      debugLog('step', step, 'tool_choice', effectiveToolChoice);
      
      const stream = this.anthropic.messages.stream({
        model: this.config.model,
        system: this.config.systemPrompt,
        max_tokens: this.maxTokens,
        messages,
        tools: this.tools,
        tool_choice: effectiveToolChoice
      });

      const pendingToolUses = new Map<number, PendingToolUse>();
      const pendingTextBlocks = new Map<number, PendingTextBlock>();
      const resolvedToolUses: ResolvedToolUse[] = [];

      try {
        for await (const rawEvent of stream) {
          debugLog('stream event', rawEvent.type, rawEvent);
          const events = this.handleStreamEvent(
            rawEvent,
            pendingToolUses,
            pendingTextBlocks,
            resolvedToolUses
          );
          for (const event of events) {
            debugLog('emitting event', event.type, event);
            yield event;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        debugLog('stream error', message);
        yield { type: 'error', timestamp: new Date().toISOString(), error: message };
        break;
      }

      const finalMessage = await stream
        .finalMessage()
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          return { error: message } as const;
        });

      if (finalMessage && 'error' in finalMessage) {
        debugLog('final message error', finalMessage.error);
        yield { type: 'error', timestamp: new Date().toISOString(), error: finalMessage.error };
        break;
      }

      if (finalMessage && !('error' in finalMessage)) {
        debugLog('final message - stop_reason:', finalMessage.stop_reason);
        debugLog('final message - content blocks:', finalMessage.content.length);
        debugLog('final message - resolved tools:', resolvedToolUses.length);
        
        messages.push({ role: 'assistant', content: finalMessage.content });
        
        if (finalMessage.stop_reason !== 'tool_use') {
          debugLog('EXIT: stop_reason is not tool_use, breaking loop');
          break;
        }
        
        if (resolvedToolUses.length === 0) {
          debugLog('EXIT: no resolved tool uses, breaking loop');
          break;
        }
        
        debugLog('CONTINUE: will execute', resolvedToolUses.length, 'tools and continue loop');
      } else {
        debugLog('EXIT: no final message or error, breaking loop');
        break;
      }

      const toolResultBlocks: AnthropicToolResultBlockParam[] = [];

      for (const resolved of resolvedToolUses) {
        debugLog('executing tool', resolved.block.name, resolved.input);
        const execution = await this.toolExecutor.execute({
          workflow: input.workflow,
          goal: input.goal,
          step,
          toolUse: resolved.block,
          input: resolved.input
        });

        if (execution?.events) {
          for (const event of execution.events) {
            debugLog('tool event', event.type, event);
            yield event;
          }
        }

        const resultBlocks = this.normalizeToolResult(resolved.block, execution?.toolResult);
        debugLog('tool result blocks', resultBlocks);
        toolResultBlocks.push(...resultBlocks);
      }

      if (toolResultBlocks.length === 0) {
        debugLog('no tool results - stopping');
        yield {
          type: 'log',
          timestamp: new Date().toISOString(),
          level: 'warn',
          message: 'No tool results returned; stopping Explorer session early.'
        };
        break;
      }

      messages.push({ role: 'user', content: toolResultBlocks });
      step += 1;
    }

    debugLog('exit runSession loop');

    if (step >= this.maxSteps) {
      yield {
        type: 'log',
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: `Explorer reached max step budget (${this.maxSteps}).`
      };
    }

    yield { type: 'end', timestamp: new Date().toISOString() };
  }

  private handleStreamEvent(
    event: AnthropicRawMessageStreamEvent,
    pendingToolUses: Map<number, PendingToolUse>,
    pendingTextBlocks: Map<number, PendingTextBlock>,
    resolvedToolUses: ResolvedToolUse[]
  ): ComputerUseEvent[] {
    const now = new Date().toISOString();

    switch (event.type) {
      case 'content_block_start': {
        if (event.content_block.type === 'tool_use') {
          pendingToolUses.set(event.index, {
            block: event.content_block,
            index: event.index,
            jsonBuffer: [],
            resolvedInput: this.normalizeInput(event.content_block.input)
          });
        } else if (event.content_block.type === 'text') {
          pendingTextBlocks.set(event.index, { index: event.index, buffer: [] });
        }
        return [];
      }
      case 'content_block_delta': {
        if (event.delta.type === 'input_json_delta') {
          const pending = pendingToolUses.get(event.index);
          if (pending) {
            pending.jsonBuffer.push(event.delta.partial_json);
          }
        } else if (event.delta.type === 'text_delta') {
          const pending = pendingTextBlocks.get(event.index);
          if (pending) {
            pending.buffer.push(event.delta.text);
          }
        }
        return [];
      }
      case 'content_block_stop': {
        const toolPending = pendingToolUses.get(event.index);
        if (toolPending) {
          pendingToolUses.delete(event.index);
          const input = this.resolveToolInput(toolPending);
          debugLog('resolved tool input', input);
          if (!input) {
            return [
              {
                type: 'error',
                timestamp: now,
                error: `Failed to parse tool input for ${toolPending.block.name}`
              }
            ];
          }

          resolvedToolUses.push({ block: toolPending.block, input });

          const actionEvent = this.createActionEvent(toolPending.block, input, now);
          return actionEvent ? [actionEvent] : [];
        }

        const textPending = pendingTextBlocks.get(event.index);
        if (textPending) {
          pendingTextBlocks.delete(event.index);
          const message = textPending.buffer.join('').trim();
          if (message.length === 0) {
            return [];
          }

          return [
            {
              type: 'log',
              timestamp: now,
              level: 'info',
              message
            }
          ];
        }

        return [];
      }
      case 'message_delta':
      case 'message_start':
      case 'message_stop':
        return [];
      default:
        return [];
    }
  }

  private normalizeInput(input: unknown): Record<string, unknown> | undefined {
    if (input && typeof input === 'object' && !Array.isArray(input)) {
      return { ...(input as Record<string, unknown>) };
    }
    return undefined;
  }

  private resolveToolInput(pending: PendingToolUse): Record<string, unknown> | null {
    // Prefer jsonBuffer if it has content (streaming case)
    if (pending.jsonBuffer.length > 0) {
      const payload = pending.jsonBuffer.join('');
      try {
        const parsed = JSON.parse(payload);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch (error) {
        debugLog('JSON parse error in jsonBuffer:', error);
        // Fall through to use resolvedInput or block.input
      }
    }

    // Use resolvedInput if available (non-streaming case)
    if (pending.resolvedInput && Object.keys(pending.resolvedInput).length > 0) {
      return pending.resolvedInput;
    }

    // Fallback to block.input
    return this.normalizeInput(pending.block.input) ?? null;
  }

  private createActionEvent(
    block: AnthropicToolUseBlock,
    input: Record<string, unknown>,
    timestamp: string
  ): ComputerUseEvent | null {
    const action = this.pickString(input, 'action') ?? block.name;
    let selector = this.pickString(input, 'selector') ?? '';
    const state =
      this.pickString(input, 'state') ?? this.pickString(input, 'context') ?? 'unknown';
    const result = this.pickString(input, 'result');
    const params = this.extractParams(input);

    if (!selector && action === 'navigate') {
      selector = 'browser';
    }

    if (!action && !selector && Object.keys(params ?? {}).length === 0) {
      return null;
    }

    return {
      type: 'action',
      timestamp,
      state,
      selector,
      action,
      params,
      result
    };
  }

  private pickString(source: Record<string, unknown>, key: string): string | undefined {
    const value = source[key];
    return typeof value === 'string' ? value : undefined;
  }

  private extractParams(input: Record<string, unknown>): Record<string, unknown> | undefined {
    const paramsCandidate = input.params;
    if (paramsCandidate && typeof paramsCandidate === 'object' && !Array.isArray(paramsCandidate)) {
      return { ...(paramsCandidate as Record<string, unknown>) };
    }

    const reserved = new Set(['action', 'selector', 'state', 'result', 'params']);
    const derived: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (reserved.has(key)) {
        continue;
      }
      derived[key] = value;
    }

    return Object.keys(derived).length > 0 ? derived : undefined;
  }

  private normalizeToolResult(
    block: AnthropicToolUseBlock,
    toolResult?: AnthropicToolResultBlockParam | AnthropicToolResultBlockParam[] | null
  ): AnthropicToolResultBlockParam[] {
    if (!toolResult) {
      return [
        {
          type: 'tool_result',
          tool_use_id: block.id,
          is_error: true,
          content: 'Tool executor did not return a result.'
        }
      ];
    }

    const blocks = Array.isArray(toolResult) ? toolResult : [toolResult];

    return blocks.map((blockResult) => ({
      type: 'tool_result',
      tool_use_id: blockResult.tool_use_id ?? block.id,
      content: blockResult.content,
      is_error: blockResult.is_error ?? false
    }));
  }
}

class NoopToolExecutor implements ToolExecutor {
  async execute(context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const action = typeof context.input.action === 'string' ? context.input.action : context.toolUse.name;
    const selector = typeof context.input.selector === 'string' ? context.input.selector : 'unknown';
    
    return {
      events: [],
      toolResult: {
        type: 'tool_result',
        tool_use_id: context.toolUse.id,
        is_error: false,
        content: `Action '${action}' on '${selector}' recorded successfully. Continue to next action.`
      }
    };
  }
}

// Re-export smart navigation modules
export * from './semantic-workflow';
export * from './smart-selector';
export * from './state-inference';
