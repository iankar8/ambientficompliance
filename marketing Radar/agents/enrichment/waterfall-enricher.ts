/**
 * Waterfall Enrichment Strategy
 * Tries multiple data sources in priority order until success
 * Primary stack: Apollo + PhantomBuster
 */

import { getApolloClient } from "./apollo-client";
import { getClearbitClient } from "./clearbit-client";
import { getPhantomBusterClient } from "./phantombuster-client";

export interface EnrichedContact {
  name: string;
  email: string;
  title: string;
  phone?: string;
  linkedin_url?: string;
  confidence: number;
  source: string;
  verified: boolean;
}

export interface EnrichedCompany {
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
}

/**
 * Waterfall contact enrichment
 * Priority: Apollo → PhantomBuster (LinkedIn) → Hunter.io → Pattern-based
 */
export async function enrichContactWaterfall(params: {
  domain: string;
  titles: string[];
  companyName?: string;
}): Promise<EnrichedContact[]> {
  const contacts: EnrichedContact[] = [];

  // 1. Try Apollo first (highest quality, verified emails)
  try {
    const apollo = getApolloClient();
    const apolloContacts = await apollo.searchContacts({
      domain: params.domain,
      titles: params.titles,
      limit: 5,
    });

    if (apolloContacts.length > 0) {
      contacts.push(
        ...apolloContacts.map((c) => ({
          name: c.name,
          email: c.email,
          title: c.title,
          phone: c.phone,
          linkedin_url: c.linkedin_url,
          confidence: c.confidence,
          source: "apollo",
          verified: c.email_status === "verified",
        }))
      );
      return contacts; // Success, return early
    }
  } catch (error) {
    console.warn("Apollo enrichment failed, trying PhantomBuster:", error);
  }

  // 2. Fallback to PhantomBuster (LinkedIn scraping)
  if (params.companyName) {
    try {
      const phantom = getPhantomBusterClient();
      
      // Search LinkedIn for contacts at this company with target titles
      for (const title of params.titles) {
        const linkedInResults = await phantom.searchLinkedInSalesNav({
          company: params.companyName,
          title: title,
          limit: 5,
        });

        // For each LinkedIn profile, try to extract email
        for (const result of linkedInResults.slice(0, 3)) {
          const email = await phantom.extractEmailFromLinkedIn(result.profileUrl);
          
          contacts.push({
            name: result.name,
            email: email || `${result.name.toLowerCase().replace(/\s+/g, '.')}@${params.domain}`,
            title: result.title,
            linkedin_url: result.profileUrl,
            confidence: email ? 0.8 : 0.4,
            source: "phantombuster",
            verified: !!email,
          });
        }

        if (contacts.length > 0) return contacts;
      }
    } catch (error) {
      console.warn("PhantomBuster failed, trying Hunter.io:", error);
    }
  }

  // 3. Fallback to Hunter.io (email verification)
  try {
    const hunterContacts = await searchHunterIO(params.domain, params.titles);
    if (hunterContacts.length > 0) {
      contacts.push(...hunterContacts);
      return contacts;
    }
  } catch (error) {
    console.warn("Hunter.io failed, trying pattern-based:", error);
  }

  // 4. Last resort: pattern-based (requires manual input)
  console.warn("All enrichment sources failed for", params.domain);

  return contacts;
}

/**
 * Waterfall company enrichment
 * Priority: Clearbit → Apollo → Manual
 */
export async function enrichCompanyWaterfall(
  domain: string
): Promise<EnrichedCompany | null> {
  // 1. Try Clearbit first (best tech stack data)
  try {
    const clearbit = getClearbitClient();
    const clearbitData = await clearbit.enrichCompany(domain);

    if (clearbitData) {
      return {
        name: clearbitData.name,
        domain: clearbitData.domain,
        industry: clearbitData.category.industry,
        employee_count: clearbitData.metrics.employees,
        revenue_range: clearbitData.metrics.estimatedAnnualRevenue,
        technologies: clearbitData.tech,
        linkedin_url: clearbitData.linkedin.handle
          ? `https://linkedin.com/company/${clearbitData.linkedin.handle}`
          : undefined,
        headquarters: {
          city: "",
          state: "",
          country: clearbitData.location,
        },
        source: "clearbit",
      };
    }
  } catch (error) {
    console.warn("Clearbit enrichment failed, trying Apollo:", error);
  }

  // 2. Fallback to Apollo
  try {
    const apollo = getApolloClient();
    const apolloData = await apollo.enrichCompany(domain);

    if (apolloData) {
      return {
        name: apolloData.name,
        domain: apolloData.domain,
        industry: apolloData.industry,
        employee_count: apolloData.employee_count,
        revenue_range: apolloData.revenue_range,
        technologies: apolloData.technologies,
        linkedin_url: apolloData.linkedin_url,
        headquarters: apolloData.headquarters,
        source: "apollo",
      };
    }
  } catch (error) {
    console.warn("Apollo enrichment failed:", error);
  }

  return null;
}

// Hunter.io helper (from existing implementation)
async function searchHunterIO(
  domain: string,
  targetTitles: string[]
): Promise<EnrichedContact[]> {
  const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
  if (!HUNTER_API_KEY) return [];

  const response = await fetch(
    `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`
  );
  const data = await response.json();

  if (!data.data?.emails) return [];

  return data.data.emails
    .filter((email: any) =>
      targetTitles.some((title) =>
        email.position?.toLowerCase().includes(title.toLowerCase())
      )
    )
    .map((email: any) => ({
      name: `${email.first_name} ${email.last_name}`,
      email: email.value,
      title: email.position || "",
      linkedin_url: email.linkedin,
      confidence: email.confidence / 100,
      source: "hunter",
      verified: email.confidence > 90,
    }));
}
