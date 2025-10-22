/**
 * Newsletter Writer
 * Formats investment opportunities into HTML email newsletter
 */

import { OpenRouterClient, MODELS } from '../lib/ai/openrouter-client';
import { supabase } from '../lib/db/supabase';
import fs from 'fs';
import path from 'path';

const openrouter = new OpenRouterClient();

export interface NewsletterContent {
  subject: string;
  preheader: string;
  marketOverview: string;
  topOpportunities: any[];
  fintechSection: string;
  cryptoSection: string;
  aiSection: string;
  portfolioRecommendations: string;
  disclaimer: string;
  htmlContent: string;
  textContent: string;
}

export class NewsletterWriter {
  /**
   * Generate newsletter from opportunities
   */
  async generateNewsletter(weekOf: string): Promise<NewsletterContent> {
    console.log(`📝 Generating newsletter for week of ${weekOf}...`);

    // Get latest snapshot and opportunities
    const { data: snapshot } = await supabase
      .from('market_snapshots')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (!snapshot) {
      throw new Error('No market snapshot found');
    }

    const { data: opportunities } = await supabase
      .from('investment_opportunities')
      .select('*')
      .eq('snapshot_id', snapshot.id)
      .order('confidence_score', { ascending: false });

    if (!opportunities || opportunities.length === 0) {
      throw new Error('No opportunities found');
    }

    console.log(`✅ Found ${opportunities.length} opportunities`);

    // Generate newsletter sections with AI
    const sections = await this.generateSections(snapshot, opportunities);

    // Format as HTML
    const htmlContent = this.formatAsHTML(sections);
    const textContent = this.formatAsText(sections);

    const newsletter: NewsletterContent = {
      ...sections,
      htmlContent,
      textContent
    };

    // Save to database
    await this.saveNewsletter(weekOf, snapshot.id, newsletter);

    console.log('✅ Newsletter generated successfully');
    return newsletter;
  }

  /**
   * Generate newsletter sections with AI
   */
  private async generateSections(snapshot: any, opportunities: any[]): Promise<any> {
    console.log('🤖 Writing newsletter sections with AI...');

    // Load style guide
    const promptPath = path.join(__dirname, '../prompts/investor-newsletter-style.txt');
    const styleGuide = fs.readFileSync(promptPath, 'utf-8');

    // Prepare data summary
    const dataSummary = this.prepareDataSummary(snapshot, opportunities);

    const prompt = `${styleGuide}

TASK: Write a weekly investor newsletter for "Code & Capital" based on this market data.

${dataSummary}

Generate the following sections:

1. SUBJECT LINE (8-12 words, compelling, specific)
2. PREHEADER (20-30 words, expands on subject)
3. MARKET OVERVIEW (150-200 words)
   - What happened this week in markets
   - Key themes and trends
   - What it means for investors
4. TOP 5 OPPORTUNITIES (already provided, just format nicely)
5. FINTECH SECTION (100-150 words)
   - Winners and losers this week
   - Key trends
   - Top pick with specific thesis
6. CRYPTO SECTION (100-150 words)
   - Market sentiment
   - Key movers
   - Top pick with specific thesis
7. AI SECTION (100-150 words)
   - Sector performance
   - Key developments
   - Top pick with specific thesis
8. PORTFOLIO RECOMMENDATIONS (100 words)
   - Suggested allocation for balanced portfolio
   - Risk management tips

Return ONLY valid JSON (no markdown, no code blocks):
{
  "subject": "...",
  "preheader": "...",
  "marketOverview": "...",
  "fintechSection": "...",
  "cryptoSection": "...",
  "aiSection": "...",
  "portfolioRecommendations": "..."
}

IMPORTANT: Escape all quotes and newlines properly in JSON strings.`;

    const response = await openrouter.complete(prompt, {
      model: MODELS.ANALYSIS,
      temperature: 0.7,
      maxTokens: 4000
    });

    // Parse JSON response - remove markdown code blocks if present
    let jsonText = response.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('AI Response:', response.substring(0, 500));
      throw new Error('Failed to parse AI response - no JSON found');
    }

    let sections;
    try {
      sections = JSON.parse(jsonMatch[0]);
    } catch (error) {
      // If parsing fails, try to fix common issues
      const fixed = jsonMatch[0]
        .replace(/[\u0000-\u001F]/g, ' ') // Replace control chars with space
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/"/g, '\\"') // Escape quotes
        .replace(/\\\\"/g, '\\"'); // Fix double escaping
      
      sections = JSON.parse(fixed);
    }
    sections.topOpportunities = opportunities.slice(0, 5);
    sections.disclaimer = this.getDisclaimer();

    return sections;
  }

  /**
   * Prepare data summary for AI
   */
  private prepareDataSummary(snapshot: any, opportunities: any[]): string {
    let summary = '=== MARKET DATA ===\n\n';

    // Indices
    summary += '**Indices:**\n';
    if (snapshot.indices) {
      Object.entries(snapshot.indices).forEach(([symbol, data]: [string, any]) => {
        summary += `- ${symbol}: $${data.price} (${data.changePercent})\n`;
      });
    }
    summary += '\n';

    // Top opportunities
    summary += '**Top 5 Investment Opportunities:**\n';
    opportunities.slice(0, 5).forEach((opp, i) => {
      summary += `${i + 1}. ${opp.symbol} (${opp.category.toUpperCase()}) - ${opp.recommendation}\n`;
      summary += `   Price: $${opp.current_price}\n`;
      summary += `   Targets: Bull $${opp.price_target_bull} / Base $${opp.price_target_base} / Bear $${opp.price_target_bear}\n`;
      summary += `   Confidence: ${(opp.confidence_score * 100).toFixed(0)}%\n`;
      summary += `   Thesis: ${opp.thesis.substring(0, 200)}...\n\n`;
    });

    // Sector performance
    summary += '**Fintech Stocks:**\n';
    if (snapshot.fintech_stocks) {
      Object.entries(snapshot.fintech_stocks).slice(0, 5).forEach(([symbol, data]: [string, any]) => {
        summary += `- ${symbol}: $${data.price} (${data.changePercent})\n`;
      });
    }
    summary += '\n';

    summary += '**AI Stocks:**\n';
    if (snapshot.ai_stocks) {
      Object.entries(snapshot.ai_stocks).slice(0, 5).forEach(([symbol, data]: [string, any]) => {
        summary += `- ${symbol}: $${data.price} (${data.changePercent})\n`;
      });
    }
    summary += '\n';

    summary += '**Cryptocurrencies:**\n';
    if (snapshot.cryptocurrencies && Array.isArray(snapshot.cryptocurrencies)) {
      snapshot.cryptocurrencies.slice(0, 5).forEach((crypto: any) => {
        summary += `- ${crypto.symbol.toUpperCase()}: $${crypto.price} (${crypto.changePercent})\n`;
      });
    }

    return summary;
  }

  /**
   * Format newsletter as HTML
   */
  private formatAsHTML(sections: any): string {
    const opportunities = sections.topOpportunities || [];

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sections.subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #0066cc;
      font-size: 32px;
    }
    .header p {
      margin: 10px 0 0 0;
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #0066cc;
      font-size: 24px;
      margin-bottom: 15px;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 10px;
    }
    .opportunity {
      background-color: #f8f9fa;
      border-left: 4px solid #0066cc;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .opportunity.buy {
      border-left-color: #28a745;
    }
    .opportunity.sell {
      border-left-color: #dc3545;
    }
    .opportunity.watch {
      border-left-color: #ffc107;
    }
    .opportunity h3 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 20px;
    }
    .opportunity .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      margin-left: 10px;
    }
    .opportunity .badge.buy {
      background-color: #28a745;
      color: white;
    }
    .opportunity .badge.sell {
      background-color: #dc3545;
      color: white;
    }
    .opportunity .badge.watch {
      background-color: #ffc107;
      color: #333;
    }
    .opportunity .metrics {
      display: flex;
      justify-content: space-between;
      margin: 15px 0;
      font-size: 14px;
    }
    .opportunity .metric {
      text-align: center;
    }
    .opportunity .metric-label {
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
    }
    .opportunity .metric-value {
      font-weight: bold;
      color: #333;
      font-size: 16px;
    }
    .opportunity .thesis {
      margin-top: 15px;
      line-height: 1.6;
    }
    .disclaimer {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 4px;
      font-size: 12px;
      color: #856404;
      margin-top: 30px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 12px;
    }
    .cta-button {
      display: inline-block;
      background-color: #0066cc;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Code & Capital</h1>
      <p>Weekly Investor Brief • ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>

    <div class="section">
      <h2>📈 Market Overview</h2>
      <p>${sections.marketOverview}</p>
    </div>

    <div class="section">
      <h2>🎯 Top 5 Investment Opportunities</h2>
      ${opportunities.map((opp: any) => `
        <div class="opportunity ${opp.recommendation.toLowerCase()}">
          <h3>
            ${opp.symbol}
            <span class="badge ${opp.recommendation.toLowerCase()}">${opp.recommendation}</span>
          </h3>
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">Current</div>
              <div class="metric-value">$${opp.current_price?.toLocaleString()}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Bull Target</div>
              <div class="metric-value">$${opp.price_target_bull?.toLocaleString()}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Base Target</div>
              <div class="metric-value">$${opp.price_target_base?.toLocaleString()}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Confidence</div>
              <div class="metric-value">${(opp.confidence_score * 100).toFixed(0)}%</div>
            </div>
          </div>
          <div class="thesis">
            <strong>Thesis:</strong> ${opp.thesis}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>💳 Fintech Sector</h2>
      <p>${sections.fintechSection}</p>
    </div>

    <div class="section">
      <h2>₿ Crypto Markets</h2>
      <p>${sections.cryptoSection}</p>
    </div>

    <div class="section">
      <h2>🤖 AI & Tech</h2>
      <p>${sections.aiSection}</p>
    </div>

    <div class="section">
      <h2>📊 Portfolio Recommendations</h2>
      <p>${sections.portfolioRecommendations}</p>
    </div>

    <div class="disclaimer">
      <strong>⚠️ Disclaimer:</strong> ${sections.disclaimer}
    </div>

    <div class="footer">
      <p><strong>Code & Capital</strong> • Weekly Investor Brief</p>
      <p>© ${new Date().getFullYear()} • All rights reserved</p>
      <p><a href="#">Unsubscribe</a> • <a href="#">View in browser</a></p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Format newsletter as plain text
   */
  private formatAsText(sections: any): string {
    const opportunities = sections.topOpportunities || [];

    return `
CODE & CAPITAL - WEEKLY INVESTOR BRIEF
${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

========================================

MARKET OVERVIEW
${sections.marketOverview}

========================================

TOP 5 INVESTMENT OPPORTUNITIES

${opportunities.map((opp: any, i: number) => `
${i + 1}. ${opp.symbol} - ${opp.recommendation}
   Current: $${opp.current_price?.toLocaleString()}
   Targets: Bull $${opp.price_target_bull} / Base $${opp.price_target_base} / Bear $${opp.price_target_bear}
   Confidence: ${(opp.confidence_score * 100).toFixed(0)}%
   
   ${opp.thesis}
`).join('\n')}

========================================

FINTECH SECTOR
${sections.fintechSection}

========================================

CRYPTO MARKETS
${sections.cryptoSection}

========================================

AI & TECH
${sections.aiSection}

========================================

PORTFOLIO RECOMMENDATIONS
${sections.portfolioRecommendations}

========================================

DISCLAIMER
${sections.disclaimer}

========================================

Code & Capital • Weekly Investor Brief
© ${new Date().getFullYear()} • All rights reserved
    `.trim();
  }

  /**
   * Get disclaimer text
   */
  private getDisclaimer(): string {
    return `This newsletter is for informational purposes only and does not constitute investment advice. All investments carry risk, including potential loss of principal. Past performance does not guarantee future results. The author may hold positions in securities mentioned. Consult a licensed financial advisor before making investment decisions. Cryptocurrency investments are highly volatile and speculative. Do your own research.`;
  }

  /**
   * Save newsletter to database
   */
  private async saveNewsletter(weekOf: string, snapshotId: string, newsletter: NewsletterContent): Promise<void> {
    const { error } = await supabase
      .from('investor_newsletters')
      .upsert({
        week_of: weekOf,
        snapshot_id: snapshotId,
        subject: newsletter.subject,
        market_overview: newsletter.marketOverview,
        top_opportunities: newsletter.topOpportunities.map(o => o.id),
        fintech_section: newsletter.fintechSection,
        crypto_section: newsletter.cryptoSection,
        ai_section: newsletter.aiSection,
        portfolio_positioning: newsletter.portfolioRecommendations,
        html_content: newsletter.htmlContent,
        markdown_content: newsletter.textContent,
        status: 'draft'
      });

    if (error) {
      console.error('Failed to save newsletter:', error);
      throw error;
    }
  }
}

// Test if run directly
if (require.main === module) {
  const writer = new NewsletterWriter();
  
  (async () => {
    try {
      const weekOf = new Date().toISOString().split('T')[0];
      const newsletter = await writer.generateNewsletter(weekOf);
      
      console.log('\n📧 NEWSLETTER PREVIEW\n');
      console.log('Subject:', newsletter.subject);
      console.log('Preheader:', newsletter.preheader);
      console.log('\n' + '='.repeat(60) + '\n');
      console.log(newsletter.textContent.substring(0, 1000) + '...');
      console.log('\n✅ Full HTML saved to database');
      
      // Optionally save HTML to file for preview
      fs.writeFileSync('/tmp/newsletter-preview.html', newsletter.htmlContent);
      console.log('💾 HTML preview saved to: /tmp/newsletter-preview.html');
      
    } catch (error) {
      console.error('Failed to generate newsletter:', error);
    }
  })();
}
