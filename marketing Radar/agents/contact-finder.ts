/**
 * Contact-Finder Agent
 * Discovers email addresses using waterfall enrichment strategy:
 * Apollo → Hunter.io → Snov.io → Pattern-based
 */

import { enrichContactWaterfall, enrichCompanyWaterfall } from "./enrichment/waterfall-enricher";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface ContactFinderInput {
  companies: Array<{
    id: string;
    name: string;
    domain: string;
    signal_id?: string | null;
    target_titles: string[]; // e.g., ["VP Fraud", "Head of Risk", "Director Payments"]
  }>;
}

interface EnrichedContactResult {
  id: string;
  name: string;
  email: string;
  title: string;
  linkedin_url?: string;
  confidence: number;
  source: string;
  signal_id?: string | null;
}

interface ContactResult {
  company_id: string;
  signal_id?: string | null;
  contacts: EnrichedContactResult[];
}

export async function contactFinder(input: ContactFinderInput): Promise<ContactResult[]> {
  const { companies } = input;
  const results: ContactResult[] = [];

  for (const company of companies) {
    try {
      const contacts = await findContactsForCompany(company);
      const storedContacts: EnrichedContactResult[] = [];

      for (const contact of contacts) {
        const saved = await storeContact(
          company.id,
          contact,
          company.signal_id ?? null
        );

        if (saved) {
          storedContacts.push(saved);
        }
      }

      results.push({
        company_id: company.id,
        signal_id: company.signal_id ?? null,
        contacts: storedContacts,
      });
    } catch (error) {
      console.error(`Failed to find contacts for ${company.name}:`, error);
      results.push({
        company_id: company.id,
        signal_id: company.signal_id ?? null,
        contacts: [],
      });
    }
  }

  return results;
}

async function findContactsForCompany(company: {
  name: string;
  domain: string;
  target_titles: string[];
}): Promise<Array<{
  name: string;
  email: string;
  title: string;
  linkedin_url?: string;
  confidence: number;
  source: string;
}>> {
  // Use waterfall enrichment strategy
  // Tries: Apollo → PhantomBuster (LinkedIn) → Hunter.io → Pattern-based
  const contacts = await enrichContactWaterfall({
    domain: company.domain,
    titles: company.target_titles,
    companyName: company.name, // Pass company name for PhantomBuster LinkedIn search
  });

  return contacts;
}

async function searchHunterIO(
  domain: string,
  targetTitles: string[]
): Promise<Array<any>> {
  const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
  if (!HUNTER_API_KEY) {
    console.warn("Hunter.io API key not configured");
    return [];
  }

  const contacts: Array<any> = [];

  try {
    // Domain search to get email pattern
    const domainResponse = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`
    );
    const domainData = await domainResponse.json();

    if (domainData.data?.emails) {
      // Filter by target titles
      for (const email of domainData.data.emails) {
        const matchesTitle = targetTitles.some((title) =>
          email.position?.toLowerCase().includes(title.toLowerCase())
        );

        if (matchesTitle) {
          contacts.push({
            name: `${email.first_name} ${email.last_name}`,
            email: email.value,
            title: email.position || "",
            linkedin_url: email.linkedin || undefined,
            confidence: email.confidence / 100,
            source: "hunter.io",
          });
        }
      }
    }
  } catch (error) {
    console.error("Hunter.io search failed:", error);
  }

  return contacts;
}

async function generatePatternEmails(
  domain: string,
  targetTitles: string[]
): Promise<Array<any>> {
  // Common patterns: {first}.{last}@, {first}{last}@, {f}{last}@
  const patterns = [
    "{first}.{last}",
    "{first}{last}",
    "{f}{last}",
    "{first}",
  ];

  // For now, return empty - would need LinkedIn scraping or manual input
  // to get actual names to apply patterns to
  return [];
}

async function storeContact(
  companyId: string,
  contact: {
    name: string;
    email: string;
    title: string;
    linkedin_url?: string;
    confidence: number;
    source: string;
    signal_id?: string | null;
  },
  signalId: string | null
): Promise<EnrichedContactResult | null> {
  const supabase = getSupabaseServerClient();

  const { data: inserted, error } = await supabase
    .from("contacts")
    .upsert(
      {
        company_id: companyId,
        name: contact.name,
        email: contact.email,
        title: contact.title,
        linkedin_url: contact.linkedin_url,
        confidence: contact.confidence,
        source: contact.source,
      },
      { onConflict: "email" }
    )
    .select()
    .single();

  if (!inserted || error) {
    console.error("Failed to upsert contact", contact.email, error);
    return null;
  }

  // Create initial contact state (ignore duplicates)
  await supabase.from("contact_states").insert({
    contact_id: inserted.id,
    signal_id: signalId,
    state: "CONTACT_FOUND",
    updated_at: new Date().toISOString(),
  }).catch((err) => {
    console.warn("contact state insert skipped", err?.message ?? err);
  });

  return {
    id: inserted.id,
    name: inserted.name,
    email: inserted.email,
    title: inserted.title ?? "",
    linkedin_url: inserted.linkedin_url ?? undefined,
    confidence: inserted.confidence ?? contact.confidence,
    source: contact.source,
    signal_id: signalId,
  };
}
