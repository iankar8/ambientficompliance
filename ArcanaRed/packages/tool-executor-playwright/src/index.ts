import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type {
  Browser,
  BrowserContext,
  BrowserType,
  LaunchOptions,
  Page
} from 'playwright-core';
import { chromium } from 'playwright-core';
import type {
  ComputerUseEvent,
  ToolExecutionContext,
  ToolExecutionResult,
  ToolExecutor
} from '@arcanared/explorer-service';

export interface PlaywrightToolExecutorOptions {
  /** Provide an already-initialised Playwright page. */
  page?: Page;
  /** Lazy page factory used when the executor needs to create a page on demand. */
  pageProvider?: () => Promise<Page>;
  /** If no page provider is supplied, we will launch this browser type. Defaults to `chromium`. */
  browserType?: BrowserType;
  /** Launch options passed to the browser type when creating a context. */
  launchOptions?: LaunchOptions;
  /** Optional Playwright context to reuse. */
  context?: BrowserContext;
  /** Capture DOM snapshots after successful actions (default: true). */
  captureDom?: boolean;
  /** Persist screenshots after each action. Supply directory to enable. */
  screenshotDirectory?: string;
  /** Capture full-page screenshots (default: false). */
  screenshotFullPage?: boolean;
  /** Close the transient page after each action (default: false). */
  newPagePerAction?: boolean;
}

interface ActionExecutionResult {
  summary: string;
  output?: string;
}

export class PlaywrightToolExecutor implements ToolExecutor {
  private context?: BrowserContext;
  private persistentPage?: Page;
  private browser?: Browser;
  private readonly captureDom: boolean;
  private readonly screenshotDirectory?: string;
  private readonly screenshotFullPage: boolean;
  private readonly newPagePerAction: boolean;

  constructor(private readonly options: PlaywrightToolExecutorOptions = {}) {
    this.captureDom = options.captureDom ?? true;
    this.screenshotDirectory = options.screenshotDirectory;
    this.screenshotFullPage = options.screenshotFullPage ?? false;
    this.newPagePerAction = options.newPagePerAction ?? false;
  }

  async dispose(): Promise<void> {
    await this.persistentPage?.close().catch(() => undefined);
    if (!this.options.context) {
      await this.context?.close().catch(() => undefined);
    }
    if (!this.options.context && !this.options.pageProvider && !this.options.page) {
      await this.browser?.close().catch(() => undefined);
    }
  }

  async execute(context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const page = await this.getPage();
    const events: ComputerUseEvent[] = [];
    const timestamp = () => new Date().toISOString();

    try {
      const action = this.resolveActionName(context);
      const result = await this.performAction(page, action, context.input);

      events.push({
        type: 'log',
        timestamp: timestamp(),
        level: 'info',
        message: `Action ${action} succeeded: ${result.summary}`
      });

      if (this.captureDom) {
        try {
          const html = await page.content();
          events.push({ type: 'dom_snapshot', timestamp: timestamp(), html });
        } catch (error) {
          events.push({
            type: 'log',
            timestamp: timestamp(),
            level: 'warn',
            message: `DOM snapshot failed: ${this.describeError(error)}`
          });
        }
      }

      if (this.screenshotDirectory) {
        const screenshotPath = await this.captureScreenshot(page, context);
        if (screenshotPath) {
          events.push({
            type: 'artifact',
            timestamp: timestamp(),
            artifactType: 'screenshot',
            path: screenshotPath,
            contentType: 'image/png',
            description: 'Per-action screenshot'
          });
        }
      }

      if (this.newPagePerAction) {
        await page.close().catch(() => undefined);
        if (!this.options.page && !this.options.pageProvider && !this.options.context) {
          this.persistentPage = undefined;
        }
      }

      return {
        events,
        toolResult: {
          type: 'tool_result',
          tool_use_id: context.toolUse.id,
          content: result.output ?? result.summary,
          is_error: false
        }
      };
    } catch (error) {
      const message = this.describeError(error);
      events.push({
        type: 'error',
        timestamp: timestamp(),
        error: message
      });

      if (this.newPagePerAction) {
        await page.close().catch(() => undefined);
        this.persistentPage = undefined;
      }

      return {
        events,
        toolResult: {
          type: 'tool_result',
          tool_use_id: context.toolUse.id,
          content: message,
          is_error: true
        }
      };
    }
  }

  private async getPage(): Promise<Page> {
    if (this.options.page) {
      return this.options.page;
    }

    if (this.options.pageProvider) {
      return this.options.pageProvider();
    }

    if (this.newPagePerAction) {
      const ctx = await this.ensureContext();
      return ctx.newPage();
    }

    if (!this.persistentPage) {
      const ctx = await this.ensureContext();
      this.persistentPage = await ctx.newPage();
    }

    return this.persistentPage;
  }

  private async ensureContext(): Promise<BrowserContext> {
    if (this.options.context) {
      this.context = this.options.context;
      return this.context;
    }

    if (this.context) {
      return this.context;
    }

    const browserType = this.options.browserType ?? chromium;
    this.browser = await browserType.launch(this.options.launchOptions);
    this.context = await this.browser.newContext();

    return this.context;
  }

  private resolveActionName(context: ToolExecutionContext): string {
    const explicit = typeof context.input.action === 'string' ? context.input.action : undefined;
    return explicit ?? context.toolUse.name;
  }

  private async performAction(page: Page, action: string, input: Record<string, unknown>): Promise<ActionExecutionResult> {
    const selector = this.expectOptionalString(input, 'selector');

    switch (action) {
      case 'navigate': {
        const url = this.expectString(input, 'url');
        await page.goto(url, { waitUntil: 'networkidle' });
        return { summary: `Navigated to ${url}` };
      }
      case 'click': {
        const target = this.expectSelector(selector, action);
        await page.click(target, {
          button: this.expectOptionalString(input, 'button') as 'left' | 'right' | 'middle' | undefined,
          timeout: this.expectOptionalNumber(input, 'timeout')
        });
        return { summary: `Clicked ${target}` };
      }
      case 'type': {
        const target = this.expectSelector(selector, action);
        const text = this.expectString(input, 'value', 'text');
        await page.type(target, text, {
          delay: this.expectOptionalNumber(input, 'delay')
        });
        return { summary: `Typed into ${target}`, output: text };
      }
      case 'fill': {
        const target = this.expectSelector(selector, action);
        const value = this.expectString(input, 'value', 'text');
        await page.fill(target, value);
        return { summary: `Filled ${target}`, output: value };
      }
      case 'press': {
        const target = this.expectSelector(selector, action);
        const key = this.expectString(input, 'key');
        await page.press(target, key);
        return { summary: `Pressed ${key} on ${target}` };
      }
      case 'select': {
        const target = this.expectSelector(selector, action);
        const value = this.expectString(input, 'value');
        await page.selectOption(target, value);
        return { summary: `Selected option ${value} on ${target}` };
      }
      case 'wait_for_selector': {
        const target = this.expectSelector(selector, action);
        const state = (this.expectOptionalString(input, 'state') ?? 'visible') as
          | 'attached'
          | 'detached'
          | 'visible'
          | 'hidden';
        await page.waitForSelector(target, {
          timeout: this.expectOptionalNumber(input, 'timeout'),
          state
        });
        return { summary: `Waited for ${target} (${state})` };
      }
      case 'wait_for_timeout': {
        const timeout = this.expectNumber(input, 'timeout');
        await page.waitForTimeout(timeout);
        return { summary: `Waited ${timeout}ms` };
      }
      case 'set_input_files': {
        const target = this.expectSelector(selector, action);
        const files = this.expectArrayOfStrings(input, 'files');
        await page.setInputFiles(target, files);
        return { summary: `Uploaded ${files.length} files via ${target}` };
      }
      default: {
        throw new Error(`Unsupported action: ${action}`);
      }
    }
  }

  private async captureScreenshot(page: Page, context: ToolExecutionContext): Promise<string | null> {
    if (!this.screenshotDirectory) {
      return null;
    }

    const dir = this.screenshotDirectory;
    await fs.mkdir(dir, { recursive: true });
    const filename = `${context.workflow}-${context.step}-${randomUUID()}.png`;
    const filepath = path.join(dir, filename);

    await page.screenshot({ path: filepath, fullPage: this.screenshotFullPage }).catch((error) => {
      throw new Error(`Screenshot failed: ${this.describeError(error)}`);
    });

    return filepath;
  }

  private expectSelector(selector: string | undefined, action: string): string {
    if (!selector) {
      throw new Error(`Action ${action} requires a selector input`);
    }
    return selector;
  }

  private expectString(
    input: Record<string, unknown>,
    ...keys: string[]
  ): string {
    for (const key of keys) {
      const value = input[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
    throw new Error(`Expected string for keys: ${keys.join(', ')}`);
  }

  private expectOptionalString(input: Record<string, unknown>, key: string): string | undefined {
    const value = input[key];
    return typeof value === 'string' ? value : undefined;
  }

  private expectNumber(input: Record<string, unknown>, key: string): number {
    const value = input[key];
    if (typeof value === 'number') {
      return value;
    }
    throw new Error(`Expected number for key ${key}`);
  }

  private expectOptionalNumber(input: Record<string, unknown>, key: string): number | undefined {
    const value = input[key];
    return typeof value === 'number' ? value : undefined;
  }

  private expectArrayOfStrings(input: Record<string, unknown>, key: string): string[] {
    const value = input[key];
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      return value;
    }
    throw new Error(`Expected array of strings for key ${key}`);
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
