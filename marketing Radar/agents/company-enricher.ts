/**
 * Company-Enricher Agent
 * Enriches company data using waterfall strategy: Clearbit → Apollo → Manual
 */

import { enrichCompanyWaterfall } from "./enrichment/waterfall-enricher";
import { withRetry, RateLimiter } from "@/lib/retry";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface CompanyEnricherInput {
  companies: Array<{
    id: string;
    domain: string;
  }>;
}

interface EnrichedCompanyResult {
  company_id: string;
  enrichment: {
    name: string;
    domain: string;
    industry: string;
    employee_count: number;
    revenue_range?: string;
    technologies: string[];
    linkedin_url?: string;
    headquarters?: {
      city: string;
      state: string;
      country: string;
    };
    source: string;
  } | null;
  error?: string;
}

const rateLimiter = new RateLimiter(3, 1000); // Max 3 concurrent, 1s between calls

export async function companyEnricher(
  input: CompanyEnricherInput
): Promise<EnrichedCompanyResult[]> {
  const { companies } = input;
  const results: EnrichedCompanyResult[] = [];

  for (const company of companies) {
    try {
      const enrichment = await rateLimiter.execute(() =>
        withRetry(
          () => enrichCompanyWaterfall(company.domain),
          {
            maxAttempts: 2,
            delayMs: 2000,
            onRetry: (error, attempt) => {
              console.warn(`Retry ${attempt} for ${company.domain}: ${error.message}`);
            },
          }
        )
      );

      results.push({
        company_id: company.id,
        enrichment,
      });

      // Store in database
      if (enrichment) {
        await storeCompanyEnrichment(company.id, enrichment);
      }
    } catch (error) {
      console.error(`Failed to enrich ${company.domain}:`, error);
      results.push({
        company_id: company.id,
        enrichment: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

async function storeCompanyEnrichment(
  companyId: string,
  enrichment: any
): Promise<void> {
  const supabase = getSupabaseServerClient();

  // Only update schema-backed columns: name, industry, employees
  // Schema columns: id, name, domain, tier, industry, employees, created_at
  await supabase
    .from("companies")
    .update({
      name: enrichment.name,
      industry: enrichment.industry,
      employees: enrichment.employee_count,
    })
    .eq("id", companyId);

  console.log(`[CompanyEnricher] Updated company ${companyId} with enrichment from ${enrichment.source}`);
}
