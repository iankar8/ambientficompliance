/**
 * Alpha Vantage API client for stock market data
 * Free tier: 25 requests/day, 5 requests/minute
 * Upgrade to premium for more: https://www.alphavantage.co/premium/
 */

import axios from 'axios';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high52Week: number;
  low52Week: number;
  pe?: number;
  eps?: number;
}

export interface CompanyOverview {
  symbol: string;
  name: string;
  description: string;
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number;
  pegRatio: number;
  bookValue: number;
  dividendYield: number;
  eps: number;
  revenuePerShare: number;
  profitMargin: number;
  operatingMargin: number;
  returnOnAssets: number;
  returnOnEquity: number;
  revenue: number;
  grossProfit: number;
  quarterlyEarningsGrowth: number;
  quarterlyRevenueGrowth: number;
}

export class AlphaVantageClient {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ALPHA_VANTAGE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  Alpha Vantage API key not found. Set ALPHA_VANTAGE_API_KEY env variable.');
    }
  }

  /**
   * Rate limiting: Max 5 requests per minute on free tier
   */
  private async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < 12000) { // 12 seconds between requests
      const waitTime = 12000 - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Get real-time quote for a stock
   */
  async getQuote(symbol: string): Promise<StockQuote> {
    await this.rateLimit();

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol,
          apikey: this.apiKey
        }
      });

      const quote = response.data['Global Quote'];
      
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error(`No data returned for ${symbol}`);
      }

      return {
        symbol,
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        high52Week: parseFloat(quote['03. high']),
        low52Week: parseFloat(quote['04. low'])
      };
    } catch (error) {
      console.error(`❌ Failed to fetch quote for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get company fundamentals and overview
   */
  async getCompanyOverview(symbol: string): Promise<CompanyOverview> {
    await this.rateLimit();

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'OVERVIEW',
          symbol,
          apikey: this.apiKey
        }
      });

      const data = response.data;
      
      if (!data || !data.Symbol) {
        throw new Error(`No overview data for ${symbol}`);
      }

      return {
        symbol: data.Symbol,
        name: data.Name,
        description: data.Description,
        sector: data.Sector,
        industry: data.Industry,
        marketCap: parseInt(data.MarketCapitalization) || 0,
        peRatio: parseFloat(data.PERatio) || 0,
        pegRatio: parseFloat(data.PEGRatio) || 0,
        bookValue: parseFloat(data.BookValue) || 0,
        dividendYield: parseFloat(data.DividendYield) || 0,
        eps: parseFloat(data.EPS) || 0,
        revenuePerShare: parseFloat(data.RevenuePerShareTTM) || 0,
        profitMargin: parseFloat(data.ProfitMargin) || 0,
        operatingMargin: parseFloat(data.OperatingMarginTTM) || 0,
        returnOnAssets: parseFloat(data.ReturnOnAssetsTTM) || 0,
        returnOnEquity: parseFloat(data.ReturnOnEquityTTM) || 0,
        revenue: parseInt(data.RevenueTTM) || 0,
        grossProfit: parseInt(data.GrossProfitTTM) || 0,
        quarterlyEarningsGrowth: parseFloat(data.QuarterlyEarningsGrowthYOY) || 0,
        quarterlyRevenueGrowth: parseFloat(data.QuarterlyRevenueGrowthYOY) || 0
      };
    } catch (error) {
      console.error(`❌ Failed to fetch overview for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get weekly price history (last 52 weeks)
   */
  async getWeeklyPrices(symbol: string, weeks: number = 52) {
    await this.rateLimit();

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_WEEKLY',
          symbol,
          apikey: this.apiKey
        }
      });

      const timeSeries = response.data['Weekly Time Series'];
      
      if (!timeSeries) {
        throw new Error(`No weekly data for ${symbol}`);
      }

      const prices = Object.entries(timeSeries)
        .slice(0, weeks)
        .map(([date, data]: [string, any]) => ({
          date,
          open: parseFloat(data['1. open']),
          high: parseFloat(data['2. high']),
          low: parseFloat(data['3. low']),
          close: parseFloat(data['4. close']),
          volume: parseInt(data['5. volume'])
        }));

      return prices;
    } catch (error) {
      console.error(`❌ Failed to fetch weekly prices for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Batch fetch quotes for multiple symbols
   * Note: This will be slow on free tier due to rate limits
   */
  async getBatchQuotes(symbols: string[]): Promise<StockQuote[]> {
    console.log(`📊 Fetching quotes for ${symbols.length} symbols...`);
    const quotes: StockQuote[] = [];

    for (const symbol of symbols) {
      try {
        const quote = await this.getQuote(symbol);
        quotes.push(quote);
        console.log(`✅ ${symbol}: $${quote.price} (${quote.changePercent > 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)`);
      } catch (error) {
        console.error(`❌ Failed to fetch ${symbol}`);
      }
    }

    return quotes;
  }

  /**
   * Calculate performance metrics
   */
  calculatePerformance(prices: any[]) {
    if (prices.length < 2) return null;

    const latest = prices[0].close;
    const weekAgo = prices[1]?.close;
    const monthAgo = prices[4]?.close;
    const yearAgo = prices[52]?.close;

    return {
      current: latest,
      week: weekAgo ? ((latest - weekAgo) / weekAgo) * 100 : null,
      month: monthAgo ? ((latest - monthAgo) / monthAgo) * 100 : null,
      year: yearAgo ? ((latest - yearAgo) / yearAgo) * 100 : null
    };
  }
}

// Example usage
if (require.main === module) {
  const client = new AlphaVantageClient();
  
  (async () => {
    try {
      // Test with NVDA
      console.log('Testing Alpha Vantage API...\n');
      
      const quote = await client.getQuote('NVDA');
      console.log('Quote:', quote);
      
      const overview = await client.getCompanyOverview('NVDA');
      console.log('\nOverview:', {
        name: overview.name,
        sector: overview.sector,
        marketCap: `$${(overview.marketCap / 1e12).toFixed(2)}T`,
        pe: overview.peRatio,
        profitMargin: `${(overview.profitMargin * 100).toFixed(1)}%`
      });
      
    } catch (error) {
      console.error('Test failed:', error);
    }
  })();
}
