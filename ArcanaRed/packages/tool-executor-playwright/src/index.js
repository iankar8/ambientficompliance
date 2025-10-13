"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightToolExecutor = void 0;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const playwright_core_1 = require("playwright-core");
class PlaywrightToolExecutor {
    options;
    context;
    persistentPage;
    browser;
    captureDom;
    screenshotDirectory;
    screenshotFullPage;
    newPagePerAction;
    constructor(options = {}) {
        this.options = options;
        this.captureDom = options.captureDom ?? true;
        this.screenshotDirectory = options.screenshotDirectory;
        this.screenshotFullPage = options.screenshotFullPage ?? false;
        this.newPagePerAction = options.newPagePerAction ?? false;
    }
    async dispose() {
        await this.persistentPage?.close().catch(() => undefined);
        if (!this.options.context) {
            await this.context?.close().catch(() => undefined);
        }
        if (!this.options.context && !this.options.pageProvider && !this.options.page) {
            await this.browser?.close().catch(() => undefined);
        }
    }
    async execute(context) {
        const page = await this.getPage();
        const events = [];
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
                }
                catch (error) {
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
        }
        catch (error) {
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
    async getPage() {
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
    async ensureContext() {
        if (this.options.context) {
            this.context = this.options.context;
            return this.context;
        }
        if (this.context) {
            return this.context;
        }
        const browserType = this.options.browserType ?? playwright_core_1.chromium;
        this.browser = await browserType.launch(this.options.launchOptions);
        this.context = await this.browser.newContext();
        return this.context;
    }
    resolveActionName(context) {
        const explicit = typeof context.input.action === 'string' ? context.input.action : undefined;
        return explicit ?? context.toolUse.name;
    }
    async performAction(page, action, input) {
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
                    button: this.expectOptionalString(input, 'button'),
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
                const state = (this.expectOptionalString(input, 'state') ?? 'visible');
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
    async captureScreenshot(page, context) {
        if (!this.screenshotDirectory) {
            return null;
        }
        const dir = this.screenshotDirectory;
        await fs_1.promises.mkdir(dir, { recursive: true });
        const filename = `${context.workflow}-${context.step}-${(0, crypto_1.randomUUID)()}.png`;
        const filepath = path_1.default.join(dir, filename);
        await page.screenshot({ path: filepath, fullPage: this.screenshotFullPage }).catch((error) => {
            throw new Error(`Screenshot failed: ${this.describeError(error)}`);
        });
        return filepath;
    }
    expectSelector(selector, action) {
        if (!selector) {
            throw new Error(`Action ${action} requires a selector input`);
        }
        return selector;
    }
    expectString(input, ...keys) {
        for (const key of keys) {
            const value = input[key];
            if (typeof value === 'string' && value.length > 0) {
                return value;
            }
        }
        throw new Error(`Expected string for keys: ${keys.join(', ')}`);
    }
    expectOptionalString(input, key) {
        const value = input[key];
        return typeof value === 'string' ? value : undefined;
    }
    expectNumber(input, key) {
        const value = input[key];
        if (typeof value === 'number') {
            return value;
        }
        throw new Error(`Expected number for key ${key}`);
    }
    expectOptionalNumber(input, key) {
        const value = input[key];
        return typeof value === 'number' ? value : undefined;
    }
    expectArrayOfStrings(input, key) {
        const value = input[key];
        if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
            return value;
        }
        throw new Error(`Expected array of strings for key ${key}`);
    }
    describeError(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
exports.PlaywrightToolExecutor = PlaywrightToolExecutor;
