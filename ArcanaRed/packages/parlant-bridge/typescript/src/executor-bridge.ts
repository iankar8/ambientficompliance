/**
 * Playwright Executor Bridge - Express server that exposes Playwright tools to Parlant
 */
import express, { Request, Response } from 'express';
import type { Page, Browser, BrowserContext } from 'playwright-core';

const app = express();
app.use(express.json());

// Global Playwright instances (in production, use session management)
let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;

interface ToolExecuteRequest {
  tool: 'click' | 'type' | 'navigate' | 'screenshot' | 'scroll';
  params: Record<string, any>;
}

interface ToolExecuteResponse {
  success: boolean;
  result?: string;
  error?: string;
  screenshot?: string;
}

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'playwright-bridge',
    executor_initialized: page !== null,
  });
});

/**
 * Initialize executor (called once per session)
 */
app.post('/executor/init', async (req: Request, res: Response) => {
  try {
    const { videoDirectory, headless = false } = req.body;
    
    // Dynamic import to avoid bundling issues
    const { chromium } = await import('playwright-core');

    browser = await chromium.launch({
      headless,
      slowMo: 100,
    });

    const contextOptions: any = {};
    if (videoDirectory) {
      contextOptions.recordVideo = {
        dir: videoDirectory,
        size: { width: 1280, height: 720 },
      };
    }

    context = await browser.newContext(contextOptions);
    page = await context.newPage();

    res.json({ success: true, message: 'Playwright initialized' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Execute a tool
 */
app.post('/tools/execute', async (req: Request, res: Response) => {
  if (!page) {
    return res.status(400).json({ success: false, error: 'Playwright not initialized' });
  }

  try {
    const { tool, params } = req.body as ToolExecuteRequest;

    let result: string;

    switch (tool) {
      case 'click':
        await page.click(params.selector);
        result = `Clicked ${params.selector}`;
        break;

      case 'type':
        if (params.delay) {
          await page.type(params.selector, params.text, { delay: params.delay });
        } else {
          await page.fill(params.selector, params.text);
        }
        result = `Typed into ${params.selector}`;
        break;

      case 'navigate':
        await page.goto(params.url, { waitUntil: 'domcontentloaded' });
        result = `Navigated to ${params.url}`;
        break;

      case 'screenshot':
        await page.screenshot({ path: params.path, fullPage: params.fullPage || false });
        result = `Screenshot saved to ${params.path}`;
        break;

      case 'scroll':
        await page.mouse.wheel(0, params.amount || 500);
        result = `Scrolled ${params.amount || 500}px`;
        break;

      default:
        return res.status(400).json({ success: false, error: `Unknown tool: ${tool}` });
    }

    // Take screenshot after action and convert to base64
    const screenshotBuffer = await page.screenshot();
    const screenshotBase64 = screenshotBuffer.toString('base64');

    res.json({
      success: true,
      result,
      screenshot: screenshotBase64,
    } as ToolExecuteResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    } as ToolExecuteResponse);
  }
});

/**
 * Cleanup executor
 */
app.post('/executor/cleanup', async (req: Request, res: Response) => {
  try {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
    
    page = null;
    context = null;
    browser = null;
    
    res.json({ success: true, message: 'Playwright cleaned up' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PLAYWRIGHT_BRIDGE_PORT || 5000;

app.listen(PORT, () => {
  console.log(`🌐 Playwright Executor Bridge listening on port ${PORT}`);
});
