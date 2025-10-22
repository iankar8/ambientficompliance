/**
 * CoinGecko API client for cryptocurrency market data
 * Free tier: 10-50 requests/minute (no API key required)
 * Pro tier: https://www.coingecko.com/en/api/pricing
 */

import axios from 'axios';

export interface CryptoQuote {
  id: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  change7d: number;
  change30d: number;
  high24h: number;
  low24h: number;
  ath: number; // All-time high
  athDate: string;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
}

export interface CryptoMarketData {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
}

export class CoinGeckoClient {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.COINGECKO_API_KEY;
  }

  private getHeaders() {
    if (this.apiKey) {
      return { 'x-cg-pro-api-key': this.apiKey };
    }
    return {};
  }

  /**
   * Get current price and market data for a cryptocurrency
   */
  async getCryptoQuote(coinId: string): Promise<CryptoQuote> {
    try {
      const response = await axios.get(`${this.baseUrl}/coins/${coinId}`, {
        headers: this.getHeaders(),
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        }
      });

      const data = response.data;
      const marketData = data.market_data;

      return {
        id: data.id,
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        price: marketData.current_price.usd,
        marketCap: marketData.market_cap.usd,
        volume24h: marketData.total_volume.usd,
        change24h: marketData.price_change_percentage_24h,
        change7d: marketData.price_change_percentage_7d,
        change30d: marketData.price_change_percentage_30d,
        high24h: marketData.high_24h.usd,
        low24h: marketData.low_24h.usd,
        ath: marketData.ath.usd,
        athDate: marketData.ath_date.usd,
        circulatingSupply: marketData.circulating_supply,
        totalSupply: marketData.total_supply,
        maxSupply: marketData.max_supply
      };
    } catch (error) {
      console.error(`❌ Failed to fetch crypto quote for ${coinId}:`, error);
      throw error;
    }
  }

  /**
   * Get top cryptocurrencies by market cap
   */
  async getTopCryptos(limit: number = 100): Promise<CryptoQuote[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/coins/markets`, {
        headers: this.getHeaders(),
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: limit,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h,7d,30d'
        }
      });

      return response.data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        change24h: coin.price_change_percentage_24h,
        change7d: coin.price_change_percentage_7d_in_currency,
        change30d: coin.price_change_percentage_30d_in_currency,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        ath: coin.ath,
        athDate: coin.ath_date,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply
      }));
    } catch (error) {
      console.error('❌ Failed to fetch top cryptos:', error);
      throw error;
    }
  }

  /**
   * Get global cryptocurrency market data
   */
  async getGlobalMarketData(): Promise<CryptoMarketData> {
    try {
      const response = await axios.get(`${this.baseUrl}/global`, {
        headers: this.getHeaders()
      });

      const data = response.data.data;

      return {
        totalMarketCap: data.total_market_cap.usd,
        totalVolume24h: data.total_volume.usd,
        btcDominance: data.market_cap_percentage.btc,
        ethDominance: data.market_cap_percentage.eth,
        marketCapChange24h: data.market_cap_change_percentage_24h_usd
      };
    } catch (error) {
      console.error('❌ Failed to fetch global market data:', error);
      throw error;
    }
  }

  /**
   * Get historical price data
   */
  async getHistoricalPrices(coinId: string, days: number = 7) {
    try {
      const response = await axios.get(`${this.baseUrl}/coins/${coinId}/market_chart`, {
        headers: this.getHeaders(),
        params: {
          vs_currency: 'usd',
          days,
          interval: days <= 1 ? 'hourly' : 'daily'
        }
      });

      return response.data.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp: new Date(timestamp),
        price
      }));
    } catch (error) {
      console.error(`❌ Failed to fetch historical prices for ${coinId}:`, error);
      throw error;
    }
  }

  /**
   * Get trending cryptocurrencies
   */
  async getTrending() {
    try {
      const response = await axios.get(`${this.baseUrl}/search/trending`, {
        headers: this.getHeaders()
      });

      return response.data.coins.map((item: any) => ({
        id: item.item.id,
        symbol: item.item.symbol,
        name: item.item.name,
        marketCapRank: item.item.market_cap_rank,
        priceChange24h: item.item.data?.price_change_percentage_24h?.usd
      }));
    } catch (error) {
      console.error('❌ Failed to fetch trending cryptos:', error);
      throw error;
    }
  }

  /**
   * Get crypto categories (DeFi, NFT, etc.)
   */
  async getCategories() {
    try {
      const response = await axios.get(`${this.baseUrl}/coins/categories`, {
        headers: this.getHeaders()
      });

      return response.data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        marketCap: cat.market_cap,
        marketCapChange24h: cat.market_cap_change_24h,
        volume24h: cat.volume_24h,
        topCoins: cat.top_3_coins
      }));
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error);
      throw error;
    }
  }

  /**
   * Batch fetch multiple cryptos
   */
  async getBatchQuotes(coinIds: string[]): Promise<CryptoQuote[]> {
    console.log(`📊 Fetching quotes for ${coinIds.length} cryptocurrencies...`);
    const quotes: CryptoQuote[] = [];

    // CoinGecko allows batch requests
    try {
      const response = await axios.get(`${this.baseUrl}/coins/markets`, {
        headers: this.getHeaders(),
        params: {
          vs_currency: 'usd',
          ids: coinIds.join(','),
          order: 'market_cap_desc',
          sparkline: false,
          price_change_percentage: '24h,7d,30d'
        }
      });

      return response.data.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        change24h: coin.price_change_percentage_24h,
        change7d: coin.price_change_percentage_7d_in_currency,
        change30d: coin.price_change_percentage_30d_in_currency,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        ath: coin.ath,
        athDate: coin.ath_date,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply
      }));
    } catch (error) {
      console.error('❌ Failed to fetch batch quotes:', error);
      throw error;
    }
  }

  /**
   * Format large numbers for display
   */
  formatMarketCap(value: number): string {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  }

  /**
   * Format price with appropriate decimals
   */
  formatPrice(price: number): string {
    if (price >= 1000) return `$${price.toFixed(0).toLocaleString()}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  }
}

// Commonly tracked coins
export const MAJOR_CRYPTOS = [
  'bitcoin',
  'ethereum',
  'binancecoin',
  'solana',
  'cardano',
  'avalanche-2',
  'polkadot',
  'polygon',
  'chainlink',
  'uniswap'
];

export const CRYPTO_STOCKS = [
  'COIN',  // Coinbase
  'MSTR',  // MicroStrategy
  'MARA',  // Marathon Digital
  'RIOT',  // Riot Platforms
  'CLSK',  // CleanSpark
  'HUT',   // Hut 8 Mining
  'BITF'   // Bitfarms
];

// Example usage
if (require.main === module) {
  const client = new CoinGeckoClient();
  
  (async () => {
    try {
      console.log('Testing CoinGecko API...\n');
      
      // Global market data
      const global = await client.getGlobalMarketData();
      console.log('Global Market:', {
        totalMarketCap: client.formatMarketCap(global.totalMarketCap),
        btcDominance: `${global.btcDominance.toFixed(1)}%`,
        change24h: `${global.marketCapChange24h > 0 ? '+' : ''}${global.marketCapChange24h.toFixed(2)}%`
      });
      
      // Bitcoin quote
      const btc = await client.getCryptoQuote('bitcoin');
      console.log('\nBitcoin:', {
        price: client.formatPrice(btc.price),
        marketCap: client.formatMarketCap(btc.marketCap),
        change24h: `${btc.change24h > 0 ? '+' : ''}${btc.change24h.toFixed(2)}%`,
        change7d: `${btc.change7d > 0 ? '+' : ''}${btc.change7d.toFixed(2)}%`
      });
      
      // Top 10 cryptos
      const top10 = await client.getTopCryptos(10);
      console.log('\nTop 10 Cryptocurrencies:');
      top10.forEach((coin, i) => {
        console.log(`${i + 1}. ${coin.name} (${coin.symbol}): ${client.formatPrice(coin.price)} (${coin.change24h > 0 ? '+' : ''}${coin.change24h.toFixed(2)}%)`);
      });
      
    } catch (error) {
      console.error('Test failed:', error);
    }
  })();
}
