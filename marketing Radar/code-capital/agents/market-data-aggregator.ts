/**
 * Market Data Aggregator
 * Collects weekly market data for fintech, crypto, and AI stocks
 */

import { FMPClient } from '../lib/data-sources/fmp';
import { CoinGeckoClient, MAJOR_CRYPTOS, CRYPTO_STOCKS } from '../lib/data-sources/coingecko';
import { supabase } from '../lib/db/supabase';

// Watchlist: Fintech, Crypto, and AI stocks
export const FINTECH_STOCKS = [
  'SQ',    // Block (Square)
  'PYPL',  // PayPal
  'V',     // Visa
  'MA',    // Mastercard
  'SOFI',  // SoFi
  'AFRM',  // Affirm
  'UPST',  // Upstart
  'NU',    // Nu Holdings
  'HOOD',  // Robinhood
  'LC'     // LendingClub
];

export const AI_STOCKS = [
  'NVDA',  // NVIDIA
  'MSFT',  // Microsoft
  'GOOGL', // Alphabet
  'META',  // Meta
  'AMZN',  // Amazon
  'AAPL',  // Apple
  'TSLA',  // Tesla
  'PLTR',  // Palantir
  'AI',    // C3.ai
  'SNOW',  // Snowflake
  'AMD',   // AMD
  'AVGO',  // Broadcom
  'ORCL'   // Oracle
];

export const INDICES = [
  'SPY',   // S&P 500
  'QQQ',   // Nasdaq 100
  'DIA',   // Dow Jones
  'IWM'    // Russell 2000
];

export interface MarketSnapshot {
  date: string;
  indices: Record<string, any>;
  fintech: Record<string, any>;
  ai: Record<string, any>;
  crypto: any[];
  cryptoStocks: Record<string, any>;
  globalCrypto: any;
}

export class MarketDataAggregator {
  private fmp: FMPClient;
  private coinGecko: CoinGeckoClient;

  constructor() {
    this.fmp = new FMPClient();
    this.coinGecko = new CoinGeckoClient();
  }

  /**
   * Aggregate all market data for the week
   */
  async aggregateWeeklyData(): Promise<MarketSnapshot> {
    const date = new Date().toISOString().split('T')[0];
    
    console.log(`📊 Aggregating market data for ${date}...`);

    try {
      // Fetch all data in parallel where possible
      const [
        indices,
        fintech,
        ai,
        cryptoStocks,
        crypto,
        globalCrypto
      ] = await Promise.all([
        this.fetchIndices(),
        this.fetchFintechStocks(),
        this.fetchAIStocks(),
        this.fetchCryptoStocks(),
        this.fetchCryptoMarkets(),
        this.coinGecko.getGlobalMarketData()
      ]);

      const snapshot: MarketSnapshot = {
        date,
        indices,
        fintech,
        ai,
        crypto,
        cryptoStocks,
        globalCrypto
      };

      // Save to database
      await this.saveSnapshot(snapshot);

      console.log('✅ Market data aggregation complete');
      return snapshot;

    } catch (error) {
      console.error('❌ Market data aggregation failed:', error);
      throw error;
    }
  }

  /**
   * Fetch index data (SPY, QQQ, DIA, IWM)
   */
  private async fetchIndices(): Promise<Record<string, any>> {
    try {
      const quotes = await this.fmp.getBatchQuotes(INDICES);
      const indices = {};
      
      for (const quote of quotes) {
        indices[quote.symbol] = {
          symbol: quote.symbol,
          price: quote.price,
          changePercent: quote.changesPercentage.toFixed(2) + '%',
          change: quote.change,
          volume: quote.volume
        };
        console.log(`  ✅ ${quote.symbol}: $${quote.price} (${quote.changesPercentage.toFixed(2)}%)`);
      }
      
      return indices;
    } catch (error: any) {
      console.error('  ❌ Failed to fetch indices:', error.message);
      return {};
    }
  }

  /**
   * Fetch fintech stock data
   */
  private async fetchFintechStocks(): Promise<Record<string, any>> {
    try {
      const quotes = await this.fmp.getBatchQuotes(FINTECH_STOCKS);
      const stocks = {};
      
      for (const quote of quotes) {
        stocks[quote.symbol] = {
          symbol: quote.symbol,
          name: quote.name,
          price: quote.price,
          changePercent: quote.changesPercentage.toFixed(2) + '%',
          change: quote.change,
          marketCap: quote.marketCap,
          volume: quote.volume
        };
        console.log(`  ✅ ${quote.symbol}: $${quote.price} (${quote.changesPercentage.toFixed(2)}%)`);
      }
      
      return stocks;
    } catch (error: any) {
      console.error('  ❌ Failed to fetch fintech stocks:', error.message);
      return {};
    }
  }

  /**
   * Fetch AI stock data
   */
  private async fetchAIStocks(): Promise<Record<string, any>> {
    try {
      const quotes = await this.fmp.getBatchQuotes(AI_STOCKS);
      const stocks = {};
      
      for (const quote of quotes) {
        stocks[quote.symbol] = {
          symbol: quote.symbol,
          name: quote.name,
          price: quote.price,
          changePercent: quote.changesPercentage.toFixed(2) + '%',
          change: quote.change,
          marketCap: quote.marketCap,
          volume: quote.volume
        };
        console.log(`  ✅ ${quote.symbol}: $${quote.price} (${quote.changesPercentage.toFixed(2)}%)`);
      }
      
      return stocks;
    } catch (error: any) {
      console.error('  ❌ Failed to fetch AI stocks:', error.message);
      return {};
    }
  }

  /**
   * Fetch crypto-related stocks
   */
  private async fetchCryptoStocks(): Promise<Record<string, any>> {
    try {
      const quotes = await this.fmp.getBatchQuotes(CRYPTO_STOCKS);
      const stocks = {};
      
      for (const quote of quotes) {
        stocks[quote.symbol] = {
          symbol: quote.symbol,
          name: quote.name,
          price: quote.price,
          changePercent: quote.changesPercentage.toFixed(2) + '%',
          change: quote.change,
          marketCap: quote.marketCap,
          volume: quote.volume
        };
        console.log(`  ✅ ${quote.symbol}: $${quote.price} (${quote.changesPercentage.toFixed(2)}%)`);
      }
      
      return stocks;
    } catch (error: any) {
      console.error('  ❌ Failed to fetch crypto stocks:', error.message);
      return {};
    }
  }

  /**
   * Fetch cryptocurrency markets
   */
  private async fetchCryptoMarkets() {
    console.log('🪙 Fetching crypto markets...');
    
    try {
      const cryptos = await this.coinGecko.getBatchQuotes(MAJOR_CRYPTOS);
      
      cryptos.forEach(coin => {
        console.log(`  ✅ ${coin.symbol}: ${this.coinGecko.formatPrice(coin.price)} (${coin.change24h > 0 ? '+' : ''}${coin.change24h.toFixed(2)}%)`);
      });

      return cryptos;
    } catch (error) {
      console.error('  ❌ Failed to fetch crypto markets');
      return [];
    }
  }

  /**
   * Save market snapshot to database
   */
  private async saveSnapshot(snapshot: MarketSnapshot) {
    try {
      const { error } = await supabase
        .from('market_snapshots')
        .insert({
          date: snapshot.date,
          indices: snapshot.indices,
          fintech_stocks: snapshot.fintech,
          ai_stocks: snapshot.ai,
          crypto_stocks: snapshot.cryptoStocks,
          cryptocurrencies: snapshot.crypto,
          global_crypto_data: snapshot.globalCrypto,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Failed to save snapshot:', error);
      } else {
        console.log('✅ Snapshot saved to database');
      }
    } catch (error) {
      console.error('❌ Database error:', error);
    }
  }

  /**
   * Get top performers of the week
   */
  getTopPerformers(snapshot: MarketSnapshot, limit: number = 5) {
    const allAssets = [
      ...snapshot.fintech.map(s => ({ ...s, category: 'Fintech' })),
      ...snapshot.ai.map(s => ({ ...s, category: 'AI' })),
      ...snapshot.cryptoStocks.map(s => ({ ...s, category: 'Crypto Stock' })),
      ...snapshot.crypto.map(c => ({ 
        symbol: c.symbol, 
        price: c.price, 
        changePercent: c.change7d,
        category: 'Crypto'
      }))
    ];

    return allAssets
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, limit);
  }

  /**
   * Get worst performers of the week
   */
  getWorstPerformers(snapshot: MarketSnapshot, limit: number = 5) {
    const allAssets = [
      ...snapshot.fintech.map(s => ({ ...s, category: 'Fintech' })),
      ...snapshot.ai.map(s => ({ ...s, category: 'AI' })),
      ...snapshot.cryptoStocks.map(s => ({ ...s, category: 'Crypto Stock' })),
      ...snapshot.crypto.map(c => ({ 
        symbol: c.symbol, 
        price: c.price, 
        changePercent: c.change7d,
        category: 'Crypto'
      }))
    ];

    return allAssets
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, limit);
  }

  /**
   * Generate market summary
   */
  generateSummary(snapshot: MarketSnapshot) {
    const spy = snapshot.indices.find(i => i.symbol === 'SPY');
    const qqq = snapshot.indices.find(i => i.symbol === 'QQQ');
    
    const avgFintech = snapshot.fintech.reduce((sum, s) => sum + s.changePercent, 0) / snapshot.fintech.length;
    const avgAI = snapshot.ai.reduce((sum, s) => sum + s.changePercent, 0) / snapshot.ai.length;
    
    return {
      indices: {
        sp500: spy?.changePercent || 0,
        nasdaq: qqq?.changePercent || 0
      },
      sectors: {
        fintech: avgFintech,
        ai: avgAI
      },
      crypto: {
        totalMarketCap: snapshot.globalCrypto.totalMarketCap,
        btcDominance: snapshot.globalCrypto.btcDominance,
        change24h: snapshot.globalCrypto.marketCapChange24h
      },
      topPerformers: this.getTopPerformers(snapshot, 5),
      worstPerformers: this.getWorstPerformers(snapshot, 5)
    };
  }
}

// CLI execution
if (require.main === module) {
  const aggregator = new MarketDataAggregator();
  
  (async () => {
    try {
      const snapshot = await aggregator.aggregateWeeklyData();
      const summary = aggregator.generateSummary(snapshot);
      
      console.log('\n📊 MARKET SUMMARY');
      console.log('=================');
      console.log(`S&P 500: ${summary.indices.sp500 > 0 ? '+' : ''}${summary.indices.sp500.toFixed(2)}%`);
      console.log(`Nasdaq: ${summary.indices.nasdaq > 0 ? '+' : ''}${summary.indices.nasdaq.toFixed(2)}%`);
      console.log(`\nFintech Avg: ${summary.sectors.fintech > 0 ? '+' : ''}${summary.sectors.fintech.toFixed(2)}%`);
      console.log(`AI Avg: ${summary.sectors.ai > 0 ? '+' : ''}${summary.sectors.ai.toFixed(2)}%`);
      console.log(`\nCrypto Market Cap: $${(summary.crypto.totalMarketCap / 1e12).toFixed(2)}T`);
      console.log(`BTC Dominance: ${summary.crypto.btcDominance.toFixed(1)}%`);
      
      console.log('\n🚀 TOP PERFORMERS:');
      summary.topPerformers.forEach((asset, i) => {
        console.log(`${i + 1}. ${asset.symbol} (${asset.category}): +${asset.changePercent.toFixed(2)}%`);
      });
      
      console.log('\n📉 WORST PERFORMERS:');
      summary.worstPerformers.forEach((asset, i) => {
        console.log(`${i + 1}. ${asset.symbol} (${asset.category}): ${asset.changePercent.toFixed(2)}%`);
      });
      
    } catch (error) {
      console.error('Failed to aggregate market data:', error);
      process.exit(1);
    }
  })();
}
