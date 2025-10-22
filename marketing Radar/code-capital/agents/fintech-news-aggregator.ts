/**
 * Fintech News Aggregator
 * Collects news about AI in finance, stablecoins, and banking innovation
 */

import { ExaClient } from '../lib/research/exa-client';
import { supabase } from '../lib/db/supabase';

const exa = new ExaClient();

export interface NewsArticle {
  title: string;
  url: string;
  publishedDate: string;
  source: string;
  summary: string;
  category: 'ai-finance' | 'stablecoins' | 'banking-tech' | 'crypto-tradfi' | 'regulatory';
  relevanceScore: number;
}

export class FintechNewsAggregator {
  /**
   * Aggregate news from the past week
   */
  async aggregateWeeklyNews(): Promise<{
    aiFinance: NewsArticle[];
    stablecoins: NewsArticle[];
    bankingTech: NewsArticle[];
    cryptoTradFi: NewsArticle[];
    regulatory: NewsArticle[];
  }> {
    console.log('📰 Aggregating fintech news from the past week...\n');

    const [aiFinance, stablecoins, bankingTech, cryptoTradFi, regulatory] = await Promise.all([
      this.fetchAIFinanceNews(),
      this.fetchStablecoinNews(),
      this.fetchBankingTechNews(),
      this.fetchCryptoTradFiNews(),
      this.fetchRegulatoryNews()
    ]);

    // Save to database
    await this.saveNews([...aiFinance, ...stablecoins, ...bankingTech, ...cryptoTradFi, ...regulatory]);

    console.log('\n✅ News aggregation complete');
    console.log(`   AI in Finance: ${aiFinance.length} articles`);
    console.log(`   Stablecoins: ${stablecoins.length} articles`);
    console.log(`   Banking Tech: ${bankingTech.length} articles`);
    console.log(`   Crypto x TradFi: ${cryptoTradFi.length} articles`);
    console.log(`   Regulatory: ${regulatory.length} articles`);

    return { aiFinance, stablecoins, bankingTech, cryptoTradFi, regulatory };
  }

  /**
   * Fetch AI in finance news
   */
  private async fetchAIFinanceNews(): Promise<NewsArticle[]> {
    console.log('🤖 Fetching AI in finance news...');
    
    const queries = [
      'AI credit underwriting banks',
      'artificial intelligence fraud detection financial services',
      'JPMorgan Goldman Sachs AI trading',
      'generative AI banking customer service',
      'machine learning risk management finance'
    ];

    const articles: NewsArticle[] = [];
    
    for (const query of queries) {
      try {
        const results = await exa.search({
          query,
          numResults: 5,
          startPublishedDate: this.getWeekAgoDate()
        });

        results.forEach(result => {
          articles.push({
            title: result.title,
            url: result.url,
            publishedDate: result.publishedDate || new Date().toISOString(),
            source: new URL(result.url).hostname,
            summary: result.text?.substring(0, 300) || '',
            category: 'ai-finance',
            relevanceScore: result.score || 0.5
          });
        });
      } catch (error) {
        console.error(`  ❌ Failed to fetch: ${query}`);
      }
    }

    console.log(`  ✅ Found ${articles.length} AI finance articles`);
    return this.deduplicateAndRank(articles).slice(0, 10);
  }

  /**
   * Fetch stablecoin news
   */
  private async fetchStablecoinNews(): Promise<NewsArticle[]> {
    console.log('💵 Fetching stablecoin news...');
    
    const queries = [
      'USDC Circle stablecoin',
      'PayPal USD PYUSD stablecoin',
      'Tether USDT stablecoin',
      'bank stablecoin digital dollar',
      'stablecoin payments cross-border',
      'JPM Coin stablecoin'
    ];

    const articles: NewsArticle[] = [];
    
    for (const query of queries) {
      try {
        const results = await exa.search({
          query,
          numResults: 5,
          startPublishedDate: this.getWeekAgoDate()
        });

        results.forEach(result => {
          articles.push({
            title: result.title,
            url: result.url,
            publishedDate: result.publishedDate || new Date().toISOString(),
            source: new URL(result.url).hostname,
            summary: result.text?.substring(0, 300) || '',
            category: 'stablecoins',
            relevanceScore: result.score || 0.5
          });
        });
      } catch (error) {
        console.error(`  ❌ Failed to fetch: ${query}`);
      }
    }

    console.log(`  ✅ Found ${articles.length} stablecoin articles`);
    return this.deduplicateAndRank(articles).slice(0, 10);
  }

  /**
   * Fetch banking tech news
   */
  private async fetchBankingTechNews(): Promise<NewsArticle[]> {
    console.log('🏦 Fetching banking tech news...');
    
    const queries = [
      'embedded finance banking-as-a-service',
      'FedNow real-time payments',
      'core banking modernization',
      'open banking API fintech',
      'BaaS platform partnership'
    ];

    const articles: NewsArticle[] = [];
    
    for (const query of queries) {
      try {
        const results = await exa.search({
          query,
          numResults: 5,
          startPublishedDate: this.getWeekAgoDate()
        });

        results.forEach(result => {
          articles.push({
            title: result.title,
            url: result.url,
            publishedDate: result.publishedDate || new Date().toISOString(),
            source: new URL(result.url).hostname,
            summary: result.text?.substring(0, 300) || '',
            category: 'banking-tech',
            relevanceScore: result.score || 0.5
          });
        });
      } catch (error) {
        console.error(`  ❌ Failed to fetch: ${query}`);
      }
    }

    console.log(`  ✅ Found ${articles.length} banking tech articles`);
    return this.deduplicateAndRank(articles).slice(0, 10);
  }

  /**
   * Fetch crypto x traditional finance news
   */
  private async fetchCryptoTradFiNews(): Promise<NewsArticle[]> {
    console.log('₿ Fetching crypto x TradFi news...');
    
    const queries = [
      'institutional crypto adoption banks',
      'Bitcoin ETF custody',
      'DeFi traditional finance partnership',
      'crypto custody solution banks',
      'tokenization real-world assets'
    ];

    const articles: NewsArticle[] = [];
    
    for (const query of queries) {
      try {
        const results = await exa.search({
          query,
          numResults: 5,
          startPublishedDate: this.getWeekAgoDate()
        });

        results.forEach(result => {
          articles.push({
            title: result.title,
            url: result.url,
            publishedDate: result.publishedDate || new Date().toISOString(),
            source: new URL(result.url).hostname,
            summary: result.text?.substring(0, 300) || '',
            category: 'crypto-tradfi',
            relevanceScore: result.score || 0.5
          });
        });
      } catch (error) {
        console.error(`  ❌ Failed to fetch: ${query}`);
      }
    }

    console.log(`  ✅ Found ${articles.length} crypto x TradFi articles`);
    return this.deduplicateAndRank(articles).slice(0, 10);
  }

  /**
   * Fetch regulatory news
   */
  private async fetchRegulatoryNews(): Promise<NewsArticle[]> {
    console.log('⚖️  Fetching regulatory news...');
    
    const queries = [
      'SEC crypto regulation stablecoin',
      'OCC banking regulation fintech',
      'Federal Reserve CBDC digital dollar',
      'stablecoin legislation Congress',
      'AI regulation financial services'
    ];

    const articles: NewsArticle[] = [];
    
    for (const query of queries) {
      try {
        const results = await exa.search({
          query,
          numResults: 5,
          startPublishedDate: this.getWeekAgoDate()
        });

        results.forEach(result => {
          articles.push({
            title: result.title,
            url: result.url,
            publishedDate: result.publishedDate || new Date().toISOString(),
            source: new URL(result.url).hostname,
            summary: result.text?.substring(0, 300) || '',
            category: 'regulatory',
            relevanceScore: result.score || 0.5
          });
        });
      } catch (error) {
        console.error(`  ❌ Failed to fetch: ${query}`);
      }
    }

    console.log(`  ✅ Found ${articles.length} regulatory articles`);
    return this.deduplicateAndRank(articles).slice(0, 10);
  }

  /**
   * Deduplicate and rank articles
   */
  private deduplicateAndRank(articles: NewsArticle[]): NewsArticle[] {
    // Remove duplicates by URL
    const seen = new Set<string>();
    const unique = articles.filter(article => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });

    // Sort by relevance score
    return unique.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get date from one week ago
   */
  private getWeekAgoDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }

  /**
   * Save news to database
   */
  private async saveNews(articles: NewsArticle[]): Promise<void> {
    const { error } = await supabase
      .from('market_news')
      .upsert(
        articles.map(article => ({
          title: article.title,
          url: article.url,
          published_at: article.publishedDate,
          source: article.source,
          summary: article.summary,
          category: article.category,
          importance_score: article.relevanceScore
        })),
        { onConflict: 'url' }
      );

    if (error) {
      console.error('Failed to save news:', error);
    }
  }
}

// Test if run directly
if (require.main === module) {
  const aggregator = new FintechNewsAggregator();
  
  (async () => {
    try {
      const news = await aggregator.aggregateWeeklyNews();
      
      console.log('\n📊 TOP STORIES BY CATEGORY\n');
      
      console.log('🤖 AI IN FINANCE:');
      news.aiFinance.slice(0, 3).forEach((article, i) => {
        console.log(`${i + 1}. ${article.title}`);
        console.log(`   ${article.source} • ${new Date(article.publishedDate).toLocaleDateString()}`);
      });
      
      console.log('\n💵 STABLECOINS:');
      news.stablecoins.slice(0, 3).forEach((article, i) => {
        console.log(`${i + 1}. ${article.title}`);
        console.log(`   ${article.source} • ${new Date(article.publishedDate).toLocaleDateString()}`);
      });
      
      console.log('\n🏦 BANKING TECH:');
      news.bankingTech.slice(0, 3).forEach((article, i) => {
        console.log(`${i + 1}. ${article.title}`);
        console.log(`   ${article.source} • ${new Date(article.publishedDate).toLocaleDateString()}`);
      });
      
    } catch (error) {
      console.error('Failed to aggregate news:', error);
    }
  })();
}
