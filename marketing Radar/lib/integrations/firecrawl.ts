/**
 * Firecrawl Integration
 * Web scraping and crawling for signal discovery and research
 */

interface FirecrawlScrapeRequest {
  url: string;
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[];
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  waitFor?: number;
}

interface FirecrawlScrapeResponse {
  success: boolean;
  data: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    links?: string[];
    screenshot?: string;
    metadata: {
      title: string;
      description: string;
      language: string;
      sourceURL: string;
    };
  };
}

interface FirecrawlCrawlRequest {
  url: string;
  limit?: number;
  scrapeOptions?: Omit<FirecrawlScrapeRequest, 'url'>;
}

interface FirecrawlCrawlResponse {
  success: boolean;
  data: Array<{
    markdown: string;
    html: string;
    metadata: {
      title: string;
      description: string;
      sourceURL: string;
    };
  }>;
}

export class FirecrawlClient {
  private apiKey: string;
  private baseUrl = 'https://api.firecrawl.dev/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FIRECRAWL_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Firecrawl API key not found');
    }
  }

  async scrape(request: FirecrawlScrapeRequest): Promise<FirecrawlScrapeResponse> {
    const response = await fetch(`${this.baseUrl}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Firecrawl API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async crawl(request: FirecrawlCrawlRequest): Promise<FirecrawlCrawlResponse> {
    const response = await fetch(`${this.baseUrl}/crawl`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Firecrawl API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Convenience method for simple scraping
  async scrapeMarkdown(url: string): Promise<string> {
    const response = await this.scrape({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
    });

    return response.data.markdown || '';
  }

  // Convenience method for getting links
  async getLinks(url: string): Promise<string[]> {
    const response = await this.scrape({
      url,
      formats: ['links'],
    });

    return response.data.links || [];
  }

  // Scrape multiple URLs in parallel
  async scrapeMultiple(urls: string[]): Promise<Array<{ url: string; markdown: string; metadata: any }>> {
    const results = await Promise.allSettled(
      urls.map(url => this.scrape({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
      }))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<FirecrawlScrapeResponse> => 
        result.status === 'fulfilled' && result.value.success
      )
      .map(result => ({
        url: result.value.data.metadata.sourceURL,
        markdown: result.value.data.markdown || '',
        metadata: result.value.data.metadata,
      }));
  }
}

// Singleton instance
let firecrawlClient: FirecrawlClient | null = null;

export function getFirecrawlClient(): FirecrawlClient {
  if (!firecrawlClient) {
    firecrawlClient = new FirecrawlClient();
  }
  return firecrawlClient;
}
