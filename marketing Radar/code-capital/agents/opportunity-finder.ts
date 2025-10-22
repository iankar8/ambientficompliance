/**
 * Investment Opportunity Finder
 * Analyzes market data and identifies top investment opportunities
 */

import { OpenRouterClient, MODELS } from '../lib/ai/openrouter-client';
import { ExaClient } from '../lib/research/exa-client';
import { supabase } from '../lib/db/supabase';
import { MarketSnapshot } from './market-data-aggregator';
import fs from 'fs';
import path from 'path';

const openrouter = new OpenRouterClient();
const exa = new ExaClient();

export interface InvestmentOpportunity {
  symbol: string;
  assetType: 'stock' | 'crypto' | 'etf';
  category: 'fintech' | 'ai' | 'crypto';
  currentPrice: number;
  recommendation: 'BUY' | 'HOLD' | 'SELL' | 'WATCH';
  thesis: string;
  catalysts: string[];
  fundamentals: any;
  technicalAnalysis: any;
  risks: string[];
  priceTargets: {
    bull: number;
    base: number;
    bear: number;
  };
  stopLoss: number;
  timeHorizon: 'short-term' | 'medium-term' | 'long-term';
  confidenceScore: number;
}

export class OpportunityFinder {
  /**
   * Find top investment opportunities from market snapshot
   */
  async findOpportunities(snapshotId: string, limit: number = 5): Promise<InvestmentOpportunity[]> {
    console.log(`🔍 Finding top ${limit} investment opportunities...`);

    // Get market snapshot
    const { data: snapshot, error } = await supabase
      .from('market_snapshots')
      .select('*')
      .eq('id', snapshotId)
      .single();

    if (error || !snapshot) {
      throw new Error('Market snapshot not found');
    }

    // Analyze with AI
    const opportunities = await this.analyzeWithAI(snapshot, limit);

    // Save to database
    for (const opp of opportunities) {
      await this.saveOpportunity(snapshotId, opp);
    }

    console.log(`✅ Found ${opportunities.length} opportunities`);
    return opportunities;
  }

  /**
   * Use AI to analyze market data and identify opportunities
   */
  private async analyzeWithAI(snapshot: any, limit: number): Promise<InvestmentOpportunity[]> {
    console.log('🤖 Analyzing market data with AI...');

    // Load analysis prompt
    const promptPath = path.join(__dirname, '../prompts/investor-newsletter-style.txt');
    const styleGuide = fs.readFileSync(promptPath, 'utf-8');

    // Prepare market data summary
    const marketSummary = this.prepareMarketSummary(snapshot);
    
    // Optionally enhance with Exa research (if available)
    let researchContext = '';
    try {
      console.log('📰 Fetching recent market news with Exa...');
      const [fintechNews, aiNews, cryptoNews] = await Promise.all([
        exa.searchFintechNews(7),
        exa.searchAINews(7),
        exa.searchCryptoNews('Bitcoin Ethereum', 7)
      ]);
      
      if (fintechNews.length > 0 || aiNews.length > 0 || cryptoNews.length > 0) {
        researchContext = '\n\nRECENT NEWS CONTEXT:\n';
        
        if (fintechNews.length > 0) {
          researchContext += '\nFintech News:\n';
          fintechNews.slice(0, 5).forEach(article => {
            researchContext += `- ${article.title} (${article.publishedDate})\n`;
          });
        }
        
        if (aiNews.length > 0) {
          researchContext += '\nAI News:\n';
          aiNews.slice(0, 5).forEach(article => {
            researchContext += `- ${article.title} (${article.publishedDate})\n`;
          });
        }
        
        if (cryptoNews.length > 0) {
          researchContext += '\nCrypto News:\n';
          cryptoNews.slice(0, 5).forEach(article => {
            researchContext += `- ${article.title} (${article.publishedDate})\n`;
          });
        }
      }
    } catch (error) {
      console.log('⚠️  Exa research unavailable, continuing with market data only');
    }

    const prompt = `${styleGuide}

You are an investment analyst for Code & Capital Weekly Investor Brief. Analyze this week's market data and identify the TOP ${limit} investment opportunities.

MARKET DATA FOR WEEK OF ${snapshot.date}:

${marketSummary}${researchContext}

Your task:
1. Identify the ${limit} BEST investment opportunities right now
2. For each opportunity, provide:
   - Symbol and current price
   - Asset type (stock/crypto) and category (fintech/ai/crypto)
   - Recommendation (BUY/HOLD/WATCH)
   - Investment thesis (2-3 paragraphs explaining WHY NOW)
   - 3-5 key catalysts (specific events with dates if known)
   - Fundamental metrics (if stock: P/E, revenue growth, margins)
   - Technical analysis (support, resistance, pattern)
   - 3-5 specific risks
   - Price targets (bull/base/bear case)
   - Stop loss level
   - Time horizon (short/medium/long-term)
   - Confidence score (0.0 to 1.0)

Focus on:
- Timely catalysts (earnings, events, technical setups)
- Asymmetric risk/reward (2:1 or better)
- Clear, actionable thesis
- Specific entry/exit levels

Return as JSON array:
[
  {
    "symbol": "NVDA",
    "assetType": "stock",
    "category": "ai",
    "currentPrice": 485.50,
    "recommendation": "BUY",
    "thesis": "NVDA at $485 offers 40% upside to our $680 price target. The thesis: H100 demand remains strong with 12-month backlog, data center revenue growing 200% YoY, and gross margins expanding to 75%. Key catalyst: Jan 22 earnings likely to show $20B+ quarterly revenue. Current valuation of 35x forward earnings justified by 100%+ revenue growth.",
    "catalysts": [
      "Jan 22: Q4 earnings (expect $20B+ revenue, up 200% YoY)",
      "Q1 2025: H200 launch (could drive 20% ASP increase)",
      "March: GTC conference (new product announcements)"
    ],
    "fundamentals": {
      "pe": 35,
      "revenueGrowth": 100,
      "grossMargin": 75,
      "marketCap": 1200000000000
    },
    "technicalAnalysis": {
      "pattern": "Consolidation in $470-$500 range",
      "resistance": 500,
      "support": 450,
      "rsi": 58,
      "trend": "Bullish"
    },
    "risks": [
      "China export restrictions (15% of revenue at risk)",
      "Competition from AMD and custom chips",
      "Valuation compression if growth slows",
      "Supply chain disruptions (TSMC dependency)"
    ],
    "priceTargets": {
      "bull": 680,
      "base": 580,
      "bear": 380
    },
    "stopLoss": 450,
    "timeHorizon": "medium-term",
    "confidenceScore": 0.85
  }
]`;

    try {
      const content = await openrouter.complete(prompt, {
        model: MODELS.ANALYSIS,
        temperature: 0.7,
        maxTokens: 8192
      });
      
      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const opportunities = JSON.parse(jsonMatch[0]);
      console.log(`✅ AI identified ${opportunities.length} opportunities`);
      
      return opportunities;

    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      throw error;
    }
  }

  /**
   * Prepare market data summary for AI analysis
   */
  private prepareMarketSummary(snapshot: any): string {
    let summary = '';

    // Indices
    summary += '## INDICES\n';
    snapshot.indices?.forEach((idx: any) => {
      summary += `- ${idx.symbol}: $${idx.price} (${idx.changePercent > 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%)\n`;
    });

    // Fintech stocks
    summary += '\n## FINTECH STOCKS\n';
    snapshot.fintech_stocks?.forEach((stock: any) => {
      summary += `- ${stock.symbol}: $${stock.price} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)\n`;
    });

    // AI stocks
    summary += '\n## AI STOCKS\n';
    snapshot.ai_stocks?.forEach((stock: any) => {
      summary += `- ${stock.symbol}: $${stock.price} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)\n`;
    });

    // Crypto stocks
    summary += '\n## CRYPTO STOCKS\n';
    snapshot.crypto_stocks?.forEach((stock: any) => {
      summary += `- ${stock.symbol}: $${stock.price} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)\n`;
    });

    // Cryptocurrencies
    summary += '\n## CRYPTOCURRENCIES\n';
    snapshot.cryptocurrencies?.forEach((crypto: any) => {
      summary += `- ${crypto.symbol}: $${crypto.price.toFixed(2)} (24h: ${crypto.change24h > 0 ? '+' : ''}${crypto.change24h.toFixed(2)}%, 7d: ${crypto.change7d > 0 ? '+' : ''}${crypto.change7d.toFixed(2)}%)\n`;
    });

    // Global crypto data
    if (snapshot.global_crypto_data) {
      const global = snapshot.global_crypto_data;
      summary += '\n## CRYPTO MARKET OVERVIEW\n';
      summary += `- Total Market Cap: $${(global.totalMarketCap / 1e12).toFixed(2)}T (${global.marketCapChange24h > 0 ? '+' : ''}${global.marketCapChange24h.toFixed(2)}%)\n`;
      summary += `- BTC Dominance: ${global.btcDominance.toFixed(1)}%\n`;
      summary += `- ETH Dominance: ${global.ethDominance.toFixed(1)}%\n`;
    }

    return summary;
  }

  /**
   * Save opportunity to database
   */
  private async saveOpportunity(snapshotId: string, opp: InvestmentOpportunity) {
    try {
      const { error } = await supabase
        .from('investment_opportunities')
        .insert({
          snapshot_id: snapshotId,
          symbol: opp.symbol,
          asset_type: opp.assetType,
          category: opp.category,
          current_price: opp.currentPrice,
          recommendation: opp.recommendation,
          thesis: opp.thesis,
          catalysts: opp.catalysts,
          fundamentals: opp.fundamentals,
          technical_analysis: opp.technicalAnalysis,
          risks: opp.risks,
          price_target_bull: opp.priceTargets.bull,
          price_target_base: opp.priceTargets.base,
          price_target_bear: opp.priceTargets.bear,
          stop_loss: opp.stopLoss,
          time_horizon: opp.timeHorizon,
          confidence_score: opp.confidenceScore
        });

      if (error) {
        console.error(`❌ Failed to save ${opp.symbol}:`, error);
      } else {
        console.log(`✅ Saved ${opp.symbol} (${opp.recommendation})`);
      }
    } catch (error) {
      console.error(`❌ Database error for ${opp.symbol}:`, error);
    }
  }

  /**
   * Get opportunities by category
   */
  async getOpportunitiesByCategory(snapshotId: string, category: 'fintech' | 'ai' | 'crypto') {
    const { data, error } = await supabase
      .from('investment_opportunities')
      .select('*')
      .eq('snapshot_id', snapshotId)
      .eq('category', category)
      .order('confidence_score', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch opportunities:', error);
      return [];
    }

    return data;
  }

  /**
   * Get top opportunities across all categories
   */
  async getTopOpportunities(snapshotId: string, limit: number = 5) {
    const { data, error } = await supabase
      .from('investment_opportunities')
      .select('*')
      .eq('snapshot_id', snapshotId)
      .order('confidence_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to fetch top opportunities:', error);
      return [];
    }

    return data;
  }
}

// CLI execution
if (require.main === module) {
  (async () => {
    try {
      // Get latest market snapshot
      const { data: snapshot, error } = await supabase
        .from('market_snapshots')
        .select('id, date')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error || !snapshot) {
        console.error('❌ No market snapshot found. Run market-data-aggregator.ts first.');
        process.exit(1);
      }

      console.log(`\n📊 Using snapshot from ${snapshot.date}`);

      const finder = new OpportunityFinder();
      const opportunities = await finder.findOpportunities(snapshot.id, 5);

      console.log('\n🎯 TOP INVESTMENT OPPORTUNITIES');
      console.log('================================\n');

      opportunities.forEach((opp, i) => {
        console.log(`${i + 1}. ${opp.symbol} (${opp.category.toUpperCase()}) - ${opp.recommendation}`);
        console.log(`   Price: $${opp.currentPrice}`);
        console.log(`   Targets: Bull $${opp.priceTargets.bull} / Base $${opp.priceTargets.base} / Bear $${opp.priceTargets.bear}`);
        console.log(`   Confidence: ${(opp.confidenceScore * 100).toFixed(0)}%`);
        console.log(`   Thesis: ${opp.thesis.substring(0, 150)}...`);
        console.log('');
      });

    } catch (error) {
      console.error('Failed to find opportunities:', error);
      process.exit(1);
    }
  })();
}
