/**
 * Financial Modeling Prep (FMP) API Client
 * https://site.financialmodelingprep.com/developer/docs
 */

import axios from 'axios';

export interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  exchange: string;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

export class FMPClient {
  private apiKey: string;
  private baseUrl = 'https://financialmodelingprep.com/api/v3';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FMP_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️  FMP API key not found. Set FMP_API_KEY env variable.');
      console.warn('Get free key at: https://site.financialmodelingprep.com/developer/docs');
    }
  }

  /**
   * Get real-time quote for a symbol
   */
  async getQuote(symbol: string): Promise<FMPQuote> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/quote/${symbol}`,
        {
          params: { apikey: this.apiKey }
        }
      );

      if (!response.data || response.data.length === 0) {
        throw new Error(`No data returned for ${symbol}`);
      }

      return response.data[0];
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Upgrade FMP plan or wait.');
      }
      throw error;
    }
  }

  /**
   * Get quotes for multiple symbols (batch request)
   */
  async getBatchQuotes(symbols: string[]): Promise<FMPQuote[]> {
    try {
      const symbolList = symbols.join(',');
      const response = await axios.get(
        `${this.baseUrl}/quote/${symbolList}`,
        {
          params: { apikey: this.apiKey }
        }
      );

      return response.data || [];
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Upgrade FMP plan or wait.');
      }
      console.error('FMP batch quotes error:', error.message);
      return [];
    }
  }

  /**
   * Get historical prices
   */
  async getHistoricalPrices(symbol: string, days: number = 30): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/historical-price-full/${symbol}`,
        {
          params: {
            apikey: this.apiKey,
            timeseries: days
          }
        }
      );

      return response.data?.historical || [];
    } catch (error: any) {
      console.error(`FMP historical prices error for ${symbol}:`, error.message);
      return [];
    }
  }

  /**
   * Get company profile
   */
  async getCompanyProfile(symbol: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/profile/${symbol}`,
        {
          params: { apikey: this.apiKey }
        }
      );

      return response.data?.[0] || null;
    } catch (error: any) {
      console.error(`FMP profile error for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Get earnings calendar
   */
  async getEarningsCalendar(from?: string, to?: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/earning_calendar`,
        {
          params: {
            apikey: this.apiKey,
            from,
            to
          }
        }
      );

      return response.data || [];
    } catch (error: any) {
      console.error('FMP earnings calendar error:', error.message);
      return [];
    }
  }
}

// Test if run directly
if (require.main === module) {
  const fmp = new FMPClient();
  
  (async () => {
    try {
      console.log('Testing FMP API...\n');
      
      // Test single quote
      console.log('Fetching NVDA quote...');
      const nvda = await fmp.getQuote('NVDA');
      console.log(`${nvda.symbol}: $${nvda.price} (${nvda.changesPercentage.toFixed(2)}%)`);
      console.log(`Market Cap: $${(nvda.marketCap / 1e9).toFixed(2)}B`);
      console.log(`P/E: ${nvda.pe?.toFixed(2) || 'N/A'}\n`);
      
      // Test batch quotes
      console.log('Fetching batch quotes...');
      const quotes = await fmp.getBatchQuotes(['AAPL', 'MSFT', 'GOOGL']);
      quotes.forEach(q => {
        console.log(`${q.symbol}: $${q.price} (${q.changesPercentage.toFixed(2)}%)`);
      });
      
    } catch (error) {
      console.error('Test failed:', error);
    }
  })();
}
