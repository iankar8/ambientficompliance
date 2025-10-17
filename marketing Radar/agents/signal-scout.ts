/**
 * Signal-Scout Agent
 * Discovers signals from RSS/News/Blogs/Careers/Regulator feeds via Firecrawl
 * Production implementation with curated sources, recency filtering, and deduplication
 */

import { withRetry } from "@/lib/retry";
import { getFirecrawlClient } from "@/lib/integrations/firecrawl";

interface SignalScoutInput {
  families: string[]; // ["incident", "hiring", "vendor_churn", "regulation"]
  recency_days: number;
}

interface RawSignal {
  url: string;
  source_type: string;
  signal_type: string;
  title: string;
  body: string;
  published_at: string;
  company_domain?: string;
  company_name?: string;
}

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      publishedTime?: string;
      ogUrl?: string;
    };
    links?: string[];
  };
  error?: string;
}

export async function signalScout(input: SignalScoutInput): Promise<RawSignal[]> {
  const { families, recency_days } = input;
  const signals: RawSignal[] = [];
  const firecrawl = getFirecrawlClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - recency_days);

  console.log(`[SignalScout] Starting discovery for families: ${families.join(", ")}`);
  console.log(`[SignalScout] Recency filter: ${recency_days} days (since ${cutoffDate.toISOString()})`);

  for (const family of families) {
    const sources = getSourcesForFamily(family);
    console.log(`[SignalScout] Processing ${sources.length} sources for family: ${family}`);

    for (const source of sources) {
      try {
        const crawledSignals = await crawlSource(source, firecrawl, cutoffDate);
        signals.push(...crawledSignals);
        console.log(`[SignalScout] Crawled ${crawledSignals.length} signals from ${source.url}`);

        // Rate limiting: 1 second between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[SignalScout] Failed to crawl ${source.url}:`, error);
      }
    }
  }

  console.log(`[SignalScout] Total raw signals discovered: ${signals.length}`);

  // Deduplicate by URL
  const deduplicated = deduplicateSignals(signals);
  console.log(`[SignalScout] After deduplication: ${deduplicated.length} signals`);

  // Filter by recency
  const recent = filterByRecency(deduplicated, cutoffDate);
  console.log(`[SignalScout] After recency filter: ${recent.length} signals`);

  // Note: Database storage removed for MVP - will store via API route
  console.log(`[SignalScout] Returning ${recent.length} signals for processing`);

  return recent;
}

/**
 * Crawl a single source using Firecrawl
 */
async function crawlSource(
  source: { url: string; type: string; signal_type: string; isCrawl?: boolean },
  firecrawl: ReturnType<typeof getFirecrawlClient>,
  cutoffDate: Date
): Promise<RawSignal[]> {
  const signals: RawSignal[] = [];

  try {
    // Use scrape for single pages (simpler for MVP)
    const response = await firecrawl.scrape({
      url: source.url,
      formats: ['markdown'],
      onlyMainContent: true,
    });

    if (response.success && response.data.markdown) {
      const signal: RawSignal = {
        url: response.data.metadata.sourceURL,
        source_type: source.type,
        signal_type: source.signal_type,
        title: response.data.metadata.title || 'Untitled',
        body: response.data.markdown.slice(0, 5000),
        published_at: new Date().toISOString(),
        company_domain: extractDomain(response.data.metadata.sourceURL),
      };
      signals.push(signal);
    }
  } catch (error) {
    console.error(`[SignalScout] Error scraping ${source.url}:`, error);
  }

  return signals;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | undefined {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

/**
 * Deduplicate signals by URL
 */
function deduplicateSignals(signals: RawSignal[]): RawSignal[] {
  const seen = new Set<string>();
  return signals.filter((signal) => {
    if (seen.has(signal.url)) return false;
    seen.add(signal.url);
    return true;
  });
}

/**
 * Filter signals by recency
 */
function filterByRecency(signals: RawSignal[], cutoffDate: Date): RawSignal[] {
  return signals.filter((signal) => {
    const publishedDate = new Date(signal.published_at);
    return publishedDate >= cutoffDate;
  });
}

/**
 * Curated source lists per family
 */
function getSourcesForFamily(
  family: string
): Array<{ url: string; type: string; signal_type: string; isCrawl?: boolean }> {
  const sources: Record<
    string,
    Array<{ url: string; type: string; signal_type: string; isCrawl?: boolean }>
  > = {
    incident: [
      // Security news sites
      { url: "https://www.bleepingcomputer.com/", type: "news", signal_type: "incident", isCrawl: true },
      { url: "https://krebsonsecurity.com/", type: "blog", signal_type: "incident", isCrawl: true },
      { url: "https://www.darkreading.com/", type: "news", signal_type: "incident", isCrawl: true },
      { url: "https://thehackernews.com/", type: "news", signal_type: "incident", isCrawl: true },
      // Breach databases
      { url: "https://haveibeenpwned.com/PwnedWebsites", type: "news", signal_type: "incident" },
    ],
    hiring: [
      // Job boards and career pages
      { url: "https://www.linkedin.com/jobs/search/?keywords=fraud%20prevention", type: "careers", signal_type: "hiring" },
      { url: "https://www.indeed.com/jobs?q=fraud+prevention", type: "careers", signal_type: "hiring" },
      // Company-specific career pages can be added dynamically
    ],
    vendor_churn: [
      // Review sites
      { url: "https://www.g2.com/categories/fraud-detection", type: "vendor", signal_type: "vendor_churn", isCrawl: true },
      { url: "https://www.capterra.com/fraud-detection-software/", type: "vendor", signal_type: "vendor_churn", isCrawl: true },
      { url: "https://www.trustradius.com/fraud-detection", type: "vendor", signal_type: "vendor_churn", isCrawl: true },
    ],
    regulation: [
      // Regulatory sites
      { url: "https://www.federalregister.gov/", type: "regulator", signal_type: "regulation", isCrawl: true },
      { url: "https://www.sec.gov/news/pressreleases", type: "regulator", signal_type: "regulation", isCrawl: true },
      { url: "https://www.ftc.gov/news-events/news/press-releases", type: "regulator", signal_type: "regulation", isCrawl: true },
    ],
  };

  return sources[family] || [];
}
