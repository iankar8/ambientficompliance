/**
 * Exa MCP Client
 * Connects to Exa via MCP (Model Context Protocol) Docker container
 * https://docs.exa.ai/
 */

import axios from 'axios';
import { spawn } from 'child_process';

export interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  score: number;
  text?: string;
  highlights?: string[];
  summary?: string;
}

export interface ExaSearchOptions {
  query: string;
  numResults?: number;
  startPublishedDate?: string;
  endPublishedDate?: string;
  includeDomains?: string[];
  excludeDomains?: string[];
  category?: 'company' | 'research paper' | 'news' | 'github' | 'tweet' | 'movie' | 'song' | 'personal site' | 'pdf';
  useAutoprompt?: boolean;
  type?: 'keyword' | 'neural' | 'auto';
}

export class ExaClient {
  private apiKey: string;
  private useMCP: boolean;

  constructor(apiKey?: string, useMCP: boolean = true) {
    this.apiKey = apiKey || process.env.EXA_API_KEY || '';
    this.useMCP = useMCP;
    
    if (!this.apiKey) {
      console.warn('⚠️  Exa API key not found. Set EXA_API_KEY env variable.');
    }
  }

  /**
   * Call Exa via MCP Docker container
   */
  private async callMCP(tool: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', [
        'run',
        '-i',
        '--rm',
        '-e',
        `EXA_API_KEY=${this.apiKey}`,
        'mcp/exa'
      ]);

      let stdout = '';
      let stderr = '';

      // Send MCP request
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: tool,
          arguments: params
        }
      };

      docker.stdin.write(JSON.stringify(request) + '\n');
      docker.stdin.end();

      docker.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      docker.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      docker.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`MCP Docker failed: ${stderr}`));
          return;
        }

        try {
          const response = JSON.parse(stdout);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
        } catch (error) {
          reject(new Error(`Failed to parse MCP response: ${stdout}`));
        }
      });
    });
  }

  /**
   * Fallback: Direct Exa API call (if MCP unavailable)
   */
  private async callDirectAPI(endpoint: string, params: any): Promise<any> {
    try {
      const response = await axios.post(
        `https://api.exa.ai/${endpoint}`,
        params,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Exa API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Search the web using Exa's neural search
   */
  async search(options: ExaSearchOptions): Promise<ExaSearchResult[]> {
    try {
      const params = {
        query: options.query,
        num_results: options.numResults || 10,
        start_published_date: options.startPublishedDate,
        end_published_date: options.endPublishedDate,
        include_domains: options.includeDomains,
        exclude_domains: options.excludeDomains,
        category: options.category,
        use_autoprompt: options.useAutoprompt ?? true,
        type: options.type || 'auto'
      };

      let response;
      if (this.useMCP) {
        // MCP tool is called 'web_search_exa'
        const mcpParams = {
          query: params.query,
          numResults: params.num_results
        };
        const mcpResponse = await this.callMCP('web_search_exa', mcpParams);
        
        // MCP returns data as JSON text inside content array
        if (mcpResponse.content && mcpResponse.content[0]?.text) {
          response = JSON.parse(mcpResponse.content[0].text);
        } else {
          response = mcpResponse;
        }
      } else {
        response = await this.callDirectAPI('search', params);
      }

      // Return results array
      return response.results || [];
    } catch (error: any) {
      console.error('❌ Exa search failed:', error.message);
      return [];
    }
  }

  /**
   * Get full content from URLs
   * Note: MCP version only supports search, not content retrieval
   */
  async getContents(urls: string[]): Promise<any[]> {
    try {
      // MCP doesn't support get_contents, use direct API
      const response = await this.callDirectAPI('contents', { urls });
      return response.contents || [];
    } catch (error: any) {
      console.error('❌ Exa get contents failed:', error.message);
      return [];
    }
  }

  /**
   * Find similar content to a URL
   * Note: MCP version only supports search, not find_similar
   */
  async findSimilar(url: string, numResults: number = 10): Promise<ExaSearchResult[]> {
    try {
      // MCP doesn't support find_similar, use direct API
      const response = await this.callDirectAPI('find-similar', {
        url,
        num_results: numResults
      });
      return response.results || [];
    } catch (error: any) {
      console.error('❌ Exa find similar failed:', error.message);
      return [];
    }
  }

  /**
   * Search for financial news about a specific stock
   */
  async searchStockNews(symbol: string, days: number = 7): Promise<ExaSearchResult[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.search({
      query: `${symbol} stock news earnings analysis`,
      numResults: 20,
      startPublishedDate: startDate.toISOString().split('T')[0],
      endPublishedDate: endDate.toISOString().split('T')[0],
      includeDomains: [
        'seekingalpha.com',
        'bloomberg.com',
        'reuters.com',
        'wsj.com',
        'ft.com',
        'cnbc.com',
        'marketwatch.com'
      ],
      category: 'news',
      useAutoprompt: true
    });
  }

  /**
   * Search for crypto news
   */
  async searchCryptoNews(asset: string, days: number = 7): Promise<ExaSearchResult[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.search({
      query: `${asset} cryptocurrency news analysis price`,
      numResults: 20,
      startPublishedDate: startDate.toISOString().split('T')[0],
      endPublishedDate: endDate.toISOString().split('T')[0],
      includeDomains: [
        'coindesk.com',
        'cointelegraph.com',
        'theblock.co',
        'decrypt.co',
        'bloomberg.com'
      ],
      category: 'news',
      useAutoprompt: true
    });
  }

  /**
   * Search for fintech industry news
   */
  async searchFintechNews(days: number = 7): Promise<ExaSearchResult[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.search({
      query: 'fintech payments digital banking neobank news',
      numResults: 30,
      startPublishedDate: startDate.toISOString().split('T')[0],
      endPublishedDate: endDate.toISOString().split('T')[0],
      includeDomains: [
        'techcrunch.com',
        'theinformation.com',
        'bloomberg.com',
        'ft.com',
        'pymnts.com'
      ],
      category: 'news',
      useAutoprompt: true
    });
  }

  /**
   * Search for AI industry news
   */
  async searchAINews(days: number = 7): Promise<ExaSearchResult[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.search({
      query: 'artificial intelligence AI machine learning news',
      numResults: 30,
      startPublishedDate: startDate.toISOString().split('T')[0],
      endPublishedDate: endDate.toISOString().split('T')[0],
      includeDomains: [
        'techcrunch.com',
        'theverge.com',
        'venturebeat.com',
        'bloomberg.com',
        'reuters.com'
      ],
      category: 'news',
      useAutoprompt: true
    });
  }

  /**
   * Research a company
   */
  async researchCompany(companyName: string, symbol: string): Promise<{
    news: ExaSearchResult[];
    research: ExaSearchResult[];
    earnings: ExaSearchResult[];
  }> {
    const [news, research, earnings] = await Promise.all([
      this.search({
        query: `${companyName} ${symbol} latest news`,
        numResults: 10,
        category: 'news',
        useAutoprompt: true
      }),
      this.search({
        query: `${companyName} ${symbol} investment analysis research`,
        numResults: 10,
        includeDomains: ['seekingalpha.com', 'fool.com', 'morningstar.com'],
        useAutoprompt: true
      }),
      this.search({
        query: `${companyName} ${symbol} earnings report`,
        numResults: 5,
        category: 'news',
        useAutoprompt: true
      })
    ]);

    return { news, research, earnings };
  }

  /**
   * Get market sentiment from recent news
   */
  async getMarketSentiment(topic: string, days: number = 7): Promise<{
    bullish: ExaSearchResult[];
    bearish: ExaSearchResult[];
    neutral: ExaSearchResult[];
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [bullish, bearish] = await Promise.all([
      this.search({
        query: `${topic} bullish positive outlook growth opportunity`,
        numResults: 10,
        startPublishedDate: startDate.toISOString().split('T')[0],
        endPublishedDate: endDate.toISOString().split('T')[0],
        useAutoprompt: true
      }),
      this.search({
        query: `${topic} bearish negative risk concern warning`,
        numResults: 10,
        startPublishedDate: startDate.toISOString().split('T')[0],
        endPublishedDate: endDate.toISOString().split('T')[0],
        useAutoprompt: true
      })
    ]);

    return {
      bullish,
      bearish,
      neutral: [] // Could implement neutral detection
    };
  }
}

// Example usage
if (require.main === module) {
  const client = new ExaClient();
  
  (async () => {
    try {
      console.log('Testing Exa MCP Client...\n');
      
      // Test stock news search
      console.log('Searching for NVDA news...');
      const nvdaNews = await client.searchStockNews('NVDA', 7);
      
      console.log(`Found ${nvdaNews.length} articles:\n`);
      nvdaNews.slice(0, 5).forEach((article, i) => {
        console.log(`${i + 1}. ${article.title}`);
        console.log(`   ${article.url}`);
        console.log(`   Published: ${article.publishedDate || 'Unknown'}`);
        console.log('');
      });
      
      // Test crypto news
      console.log('\nSearching for Bitcoin news...');
      const btcNews = await client.searchCryptoNews('Bitcoin', 7);
      console.log(`Found ${btcNews.length} crypto articles`);
      
    } catch (error) {
      console.error('Test failed:', error);
    }
  })();
}
