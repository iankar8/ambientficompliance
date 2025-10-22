/**
 * Morning Brew-Style Newsletter Writer
 * Creates Code & Capital newsletter focused on AI, stablecoins, and banking innovation
 */

import { OpenRouterClient, MODELS } from '../lib/ai/openrouter-client';
import { supabase } from '../lib/db/supabase';
import fs from 'fs';
import path from 'path';

const openrouter = new OpenRouterClient();

export interface MorningBrewNewsletter {
  subject: string;
  preheader: string;
  leadStory: string;
  quickHits: string[];
  chartOfWeek: string;
  deepDive: string;
  whatWereWatching: string[];
  waterCooler?: string;
  htmlContent: string;
  textContent: string;
}

export class MorningBrewWriter {
  /**
   * Generate Morning Brew-style newsletter
   */
  async generateNewsletter(weekOf: string): Promise<MorningBrewNewsletter> {
    console.log(`📝 Generating Code & Capital newsletter for week of ${weekOf}...\n`);

    // Get news from the past week
    const news = await this.getWeeklyNews();
    
    if (!news || news.length === 0) {
      throw new Error('No news found for this week. Run fintech-news-aggregator first.');
    }

    console.log(`✅ Found ${news.length} articles to work with\n`);

    // Generate newsletter sections with AI
    const sections = await this.generateSections(news);

    // Format as HTML
    const htmlContent = this.formatAsHTML(sections);
    const textContent = this.formatAsText(sections);

    const newsletter: MorningBrewNewsletter = {
      ...sections,
      htmlContent,
      textContent
    };

    // Save to database
    await this.saveNewsletter(weekOf, newsletter);

    console.log('✅ Newsletter generated successfully');
    return newsletter;
  }

  /**
   * Get news from the past week
   */
  private async getWeeklyNews(): Promise<any[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('market_news')
      .select('*')
      .gte('published_at', weekAgo.toISOString())
      .order('importance_score', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to fetch news:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Generate newsletter sections with AI
   */
  private async generateSections(news: any[]): Promise<any> {
    console.log('🤖 Writing newsletter with AI (Morning Brew style)...\n');

    // Load style guide
    const promptPath = path.join(__dirname, '../prompts/morning-brew-style.txt');
    const styleGuide = fs.readFileSync(promptPath, 'utf-8');

    // Organize news by category
    const newsByCategory = {
      aiFinance: news.filter(n => n.category === 'ai-finance'),
      stablecoins: news.filter(n => n.category === 'stablecoins'),
      bankingTech: news.filter(n => n.category === 'banking-tech'),
      cryptoTradFi: news.filter(n => n.category === 'crypto-tradfi'),
      regulatory: news.filter(n => n.category === 'regulatory')
    };

    // Prepare news summary for AI
    const newsSummary = this.prepareNewsSummary(newsByCategory);

    const prompt = `${styleGuide}

TASK: Write this week's Code & Capital newsletter based on the news below.

${newsSummary}

Generate the following sections in JSON format:

{
  "subject": "8-12 word subject line that hooks the reader",
  "preheader": "20-30 word preheader that expands on subject",
  "leadStory": "150-200 word lead story about the BIGGEST thing that happened this week. Make it punchy and relevant to bank innovation execs.",
  "quickHits": [
    "5-7 quick hits, each 1-2 sentences with company name in bold. Mix of AI, stablecoins, banking tech, crypto x TradFi, regulatory."
  ],
  "chartOfWeek": "50-75 words describing a key data point or trend. Make it insightful.",
  "deepDive": "300-400 word deep dive on ONE topic. Pick the most interesting trend from the news. Be opinionated and forward-looking.",
  "whatWereWatching": [
    "3-4 bullets on early signals or emerging trends to monitor. Each 1-2 sentences."
  ],
  "waterCooler": "Optional 50-word hot take or industry gossip. Make it fun but professional."
}

IMPORTANT:
- Use Morning Brew tone: smart, witty, insider perspective
- Focus on implications for banks and financial institutions
- Be specific with numbers, companies, dates
- Have a point of view - don't just report
- Make it actionable - what should readers do with this info?

Return ONLY valid JSON (no markdown, no code blocks).`;

    const response = await openrouter.complete(prompt, {
      model: MODELS.ANALYSIS,
      temperature: 0.8, // Higher for more creative writing
      maxTokens: 4000
    });

    // Parse JSON response
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
      console.error('JSON parse error:', error);
      console.error('Response:', jsonMatch[0].substring(0, 500));
      throw error;
    }

    return sections;
  }

  /**
   * Prepare news summary for AI
   */
  private prepareNewsSummary(newsByCategory: any): string {
    let summary = '=== THIS WEEK\'S NEWS ===\n\n';

    // AI in Finance
    if (newsByCategory.aiFinance.length > 0) {
      summary += '**AI IN FINANCE:**\n';
      newsByCategory.aiFinance.slice(0, 5).forEach((article: any) => {
        summary += `- ${article.title}\n`;
        summary += `  Source: ${article.source} | ${new Date(article.published_at).toLocaleDateString()}\n`;
        if (article.summary) {
          summary += `  ${article.summary.substring(0, 150)}...\n`;
        }
        summary += '\n';
      });
    }

    // Stablecoins
    if (newsByCategory.stablecoins.length > 0) {
      summary += '**STABLECOINS:**\n';
      newsByCategory.stablecoins.slice(0, 5).forEach((article: any) => {
        summary += `- ${article.title}\n`;
        summary += `  Source: ${article.source} | ${new Date(article.published_at).toLocaleDateString()}\n`;
        if (article.summary) {
          summary += `  ${article.summary.substring(0, 150)}...\n`;
        }
        summary += '\n';
      });
    }

    // Banking Tech
    if (newsByCategory.bankingTech.length > 0) {
      summary += '**BANKING TECH:**\n';
      newsByCategory.bankingTech.slice(0, 5).forEach((article: any) => {
        summary += `- ${article.title}\n`;
        summary += `  Source: ${article.source} | ${new Date(article.published_at).toLocaleDateString()}\n`;
        if (article.summary) {
          summary += `  ${article.summary.substring(0, 150)}...\n`;
        }
        summary += '\n';
      });
    }

    // Crypto x TradFi
    if (newsByCategory.cryptoTradFi.length > 0) {
      summary += '**CRYPTO x TRADITIONAL FINANCE:**\n';
      newsByCategory.cryptoTradFi.slice(0, 5).forEach((article: any) => {
        summary += `- ${article.title}\n`;
        summary += `  Source: ${article.source} | ${new Date(article.published_at).toLocaleDateString()}\n`;
        if (article.summary) {
          summary += `  ${article.summary.substring(0, 150)}...\n`;
        }
        summary += '\n';
      });
    }

    // Regulatory
    if (newsByCategory.regulatory.length > 0) {
      summary += '**REGULATORY:**\n';
      newsByCategory.regulatory.slice(0, 5).forEach((article: any) => {
        summary += `- ${article.title}\n`;
        summary += `  Source: ${article.source} | ${new Date(article.published_at).toLocaleDateString()}\n`;
        if (article.summary) {
          summary += `  ${article.summary.substring(0, 150)}...\n`;
        }
        summary += '\n';
      });
    }

    return summary;
  }

  /**
   * Format newsletter as HTML (WSJ premium newspaper design)
   */
  private formatAsHTML(sections: any): string {
    // Icon mapping for different types of news
    const newsIcons = ['🏦', '⚖️', '🤖', '💳', '📊', '🔐', '💰', '⚡'];
    
    const quickHitsHTML = sections.quickHits.map((hit: string, i: number) => {
      const icon = newsIcons[i % newsIcons.length];
      
      return `
        <div class="news-item">
          <div class="stipple-dot">${icon}</div>
          <div class="news-content">${hit}</div>
        </div>`;
    }).join('');
    
    const watchingHTML = sections.whatWereWatching.map((item: string, i: number) => `
      <div class="analysis-item">
        <div class="analysis-marker">▪</div>
        <div class="analysis-text">${item}</div>
      </div>`).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sections.subject}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Escrow+Condensed:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Georgia:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.6;
      color: #222;
      background: #f4f1ed;
      padding: 0;
    }
    
    .container {
      max-width: 700px;
      margin: 20px auto;
      background: #fff;
      box-shadow: 0 0 40px rgba(0,0,0,0.1);
    }
    
    /* WSJ-style masthead with brand blue */
    .header {
      background: linear-gradient(135deg, #2c4a6e 0%, #4a6fa5 100%);
      border-top: 4px solid #d4af37;
      border-bottom: 1px solid #1a3a5a;
      padding: 0;
      position: relative;
    }
    
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%);
    }
    
    .masthead {
      text-align: center;
      padding: 32px 40px 24px;
      border-bottom: 3px double rgba(255, 255, 255, 0.2);
    }
    
    .publication-name {
      font-family: 'Libre Baskerville', Georgia, serif;
      font-size: 52px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 2px;
      margin-bottom: 8px;
      text-transform: uppercase;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    
    .publication-tagline {
      font-family: Georgia, serif;
      font-size: 12px;
      color: #d4af37;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-weight: 400;
    }
    
    .issue-info {
      background: linear-gradient(135deg, #f8f8f8 0%, #fff 100%);
      border-bottom: 1px solid #ddd;
      padding: 14px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: Georgia, serif;
      font-size: 11px;
      color: #666;
    }
    
    .issue-date {
      font-weight: 700;
      color: #000;
    }
    
    .issue-meta {
      color: #4a6fa5;
      font-weight: 600;
      font-style: italic;
    }
    
    /* Content area */
    .content {
      padding: 40px 50px;
      background: #fff;
    }
    
    /* Section styling - WSJ newspaper sections */
    .section {
      margin-bottom: 40px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 32px;
    }
    
    .section:last-of-type {
      border-bottom: none;
    }
    
    .section-header {
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 3px solid #2c4a6e;
    }
    
    .section-title {
      font-family: 'Libre Baskerville', Georgia, serif;
      font-size: 18px;
      font-weight: 700;
      color: #2c4a6e;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    
    /* Lead story - WSJ feature article */
    .lead-story {
      font-family: Georgia, serif;
      font-size: 17px;
      line-height: 1.75;
      color: #222;
      text-align: justify;
    }
    
    .lead-story::first-letter {
      font-family: 'Libre Baskerville', Georgia, serif;
      font-size: 72px;
      font-weight: 700;
      float: left;
      line-height: 0.75;
      margin: 8px 10px 0 0;
      color: #2c4a6e;
    }
    
    /* News briefs - WSJ style */
    .quick-hits {
      display: block;
    }
    
    .news-item {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px dotted #ccc;
    }
    
    .news-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .stipple-dot {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #2c4a6e 0%, #4a6fa5 100%);
      border: 2px solid #d4af37;
      color: #fff;
      font-size: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(44, 74, 110, 0.2);
    }
    
    .news-content {
      flex: 1;
      font-family: Georgia, serif;
      font-size: 15px;
      line-height: 1.6;
      color: #333;
    }
    
    /* Data box - WSJ style with brand color */
    .chart-box {
      background: #f9f9f9;
      border: 2px solid #2c4a6e;
      border-top: 4px solid #2c4a6e;
      padding: 24px;
      margin: 24px 0;
    }
    
    .chart-box-content {
      font-family: Georgia, serif;
      font-size: 15px;
      line-height: 1.7;
      color: #222;
      font-style: italic;
    }
    
    /* Analysis section - WSJ editorial style */
    .deep-dive {
      font-family: Georgia, serif;
      font-size: 16px;
      line-height: 1.75;
      color: #222;
      text-align: justify;
    }
    
    .deep-dive p {
      margin-bottom: 18px;
      text-indent: 24px;
    }
    
    .deep-dive p:first-child {
      text-indent: 0;
    }
    
    .deep-dive p:first-child::first-letter {
      font-family: 'Libre Baskerville', Georgia, serif;
      font-size: 56px;
      font-weight: 700;
      float: left;
      line-height: 0.8;
      margin: 4px 8px 0 0;
      color: #2c4a6e;
    }
    
    /* Analysis items - WSJ bullet style */
    .watching-list {
      display: block;
    }
    
    .analysis-item {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
      padding-left: 8px;
    }
    
    .analysis-marker {
      flex-shrink: 0;
      font-size: 18px;
      color: #000;
      font-weight: 700;
      margin-top: 2px;
    }
    
    .analysis-text {
      flex: 1;
      font-family: Georgia, serif;
      font-size: 15px;
      line-height: 1.6;
      color: #333;
    }
    
    /* Editorial note - WSJ opinion style */
    .water-cooler {
      background: #fafafa;
      border-left: 4px solid #d4af37;
      padding: 20px 24px;
      margin: 20px 0;
      font-family: Georgia, serif;
      font-size: 15px;
      font-style: italic;
      line-height: 1.7;
      color: #444;
    }
    
    /* Call to action - elegant style */
    .cta {
      background: #2c4a6e;
      color: #fff;
      padding: 16px 32px;
      text-align: center;
      margin: 32px 0;
      font-family: 'Libre Baskerville', Georgia, serif;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 1px;
      text-transform: uppercase;
      border: 3px solid #2c4a6e;
      border-top: 3px solid #d4af37;
    }
    
    /* Footer - newspaper colophon with brand color */
    .footer {
      background: #f8f8f8;
      border-top: 3px solid #2c4a6e;
      padding: 32px 40px;
      text-align: center;
      font-family: Georgia, serif;
      position: relative;
    }
    
    .footer::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%);
    }
    
    .footer-logo {
      font-family: 'Libre Baskerville', Georgia, serif;
      font-size: 16px;
      font-weight: 700;
      color: #2c4a6e;
      margin-bottom: 8px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    
    .footer-tagline {
      color: #666;
      margin-bottom: 16px;
      font-style: italic;
      font-size: 11px;
    }
    
    .footer-links {
      margin: 16px 0;
      border-top: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
      padding: 12px 0;
    }
    
    .footer-links a {
      color: #2c4a6e;
      text-decoration: none;
      margin: 0 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 10px;
    }
    
    .footer-links a:hover {
      color: #d4af37;
    }
    
    .footer-copyright {
      font-size: 10px;
      color: #999;
      margin-top: 12px;
    }
    
    /* Responsive design */
    @media (max-width: 640px) {
      .container {
        margin: 0;
      }
      
      .masthead {
        padding: 20px 24px 16px;
      }
      
      .publication-name {
        font-size: 32px;
      }
      
      .content {
        padding: 32px 24px;
      }
      
      .section {
        margin-bottom: 32px;
      }
      
      .lead-story::first-letter,
      .deep-dive p:first-child::first-letter {
        font-size: 48px;
      }
    }
    
    /* Typography enhancements */
    strong {
      color: #000;
      font-weight: 700;
    }
    
    a {
      color: #000;
      text-decoration: underline;
    }
    
    a:hover {
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- WSJ-style Masthead -->
    <div class="header">
      <div class="masthead">
        <div class="publication-name">Code & Capital</div>
        <div class="publication-tagline">The Future of Financial Services</div>
      </div>
      <div class="issue-info">
        <div class="issue-date">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        <div class="issue-meta">Digital Edition</div>
      </div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Lead Story -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">Top News</div>
        </div>
        <div class="lead-story">
          ${sections.leadStory}
        </div>
      </div>

      <!-- News Briefs -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">What's News</div>
        </div>
        <div class="quick-hits">
          ${quickHitsHTML}
        </div>
      </div>

      <!-- Data Point -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">By The Numbers</div>
        </div>
        <div class="chart-box">
          <div class="chart-box-content">
            ${sections.chartOfWeek}
          </div>
        </div>
      </div>

      <!-- Analysis -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">Analysis & Commentary</div>
        </div>
        <div class="deep-dive">
          ${sections.deepDive.split('\n\n').map((p: string) => `<p>${p}</p>`).join('')}
        </div>
      </div>

      <!-- Market Watch -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">Market Watch</div>
        </div>
        <div class="watching-list">
          ${watchingHTML}
        </div>
      </div>

      <!-- Editorial Note -->
      ${sections.waterCooler ? `
      <div class="section">
        <div class="section-header">
          <div class="section-title">Editor's Note</div>
        </div>
        <div class="water-cooler">
          ${sections.waterCooler}
        </div>
      </div>
      ` : ''}

      <!-- CTA -->
      <div class="cta">
        Share With Your Team
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">Code & Capital</div>
      <div class="footer-tagline">AI, Stablecoins, and the Future of Financial Services</div>
      <div class="footer-links">
        <a href="#">Web Edition</a>
        <a href="#">Archive</a>
        <a href="#">Subscribe</a>
        <a href="#">Unsubscribe</a>
      </div>
      <div class="footer-copyright">
        © ${new Date().getFullYear()} Code & Capital. All Rights Reserved.
      </div>
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
    return `
CODE & CAPITAL
${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
AI, stablecoins, and the future of financial services

========================================

THE LEAD

${sections.leadStory}

========================================

QUICK HITS

${sections.quickHits.map((hit: string, i: number) => `${i + 1}. ${hit.replace(/<[^>]*>/g, '')}`).join('\n\n')}

========================================

CHART OF THE WEEK

${sections.chartOfWeek}

========================================

DEEP DIVE

${sections.deepDive}

========================================

WHAT WE'RE WATCHING

${sections.whatWereWatching.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n\n')}

${sections.waterCooler ? `
========================================

WATER COOLER

${sections.waterCooler}
` : ''}

========================================

Forward this to your innovation team.

Unsubscribe | View in browser

© ${new Date().getFullYear()} Code & Capital
    `.trim();
  }

  /**
   * Save newsletter to database
   */
  private async saveNewsletter(weekOf: string, newsletter: MorningBrewNewsletter): Promise<void> {
    const { error } = await supabase
      .from('investor_newsletters')
      .upsert({
        week_of: weekOf,
        subject: newsletter.subject,
        market_overview: newsletter.leadStory,
        html_content: newsletter.htmlContent,
        markdown_content: newsletter.textContent,
        status: 'draft'
      }, {
        onConflict: 'week_of'
      });

    if (error) {
      console.error('Failed to save newsletter:', error);
      throw error;
    }
  }
}

// Test if run directly
if (require.main === module) {
  const writer = new MorningBrewWriter();
  
  (async () => {
    try {
      const weekOf = new Date().toISOString().split('T')[0];
      const newsletter = await writer.generateNewsletter(weekOf);
      
      console.log('\n📧 NEWSLETTER PREVIEW\n');
      console.log('Subject:', newsletter.subject);
      console.log('Preheader:', newsletter.preheader);
      console.log('\n' + '='.repeat(60) + '\n');
      console.log(newsletter.textContent.substring(0, 1500) + '...');
      console.log('\n✅ Full HTML saved to database');
      
      // Save HTML to file for preview
      fs.writeFileSync('/tmp/code-capital-preview.html', newsletter.htmlContent);
      console.log('💾 HTML preview saved to: /tmp/code-capital-preview.html');
      
    } catch (error) {
      console.error('Failed to generate newsletter:', error);
    }
  })();
}
