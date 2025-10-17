/**
 * Researcher Agent
 * Builds person-level dossiers from public sources
 */

import { withRetry, RateLimiter } from "@/lib/retry";
import { getOpenRouterClient } from "@/lib/integrations/openrouter";
import { getFirecrawlClient } from "@/lib/integrations/firecrawl";

const rateLimiter = new RateLimiter(3, 500); // Max 3 concurrent, 500ms between calls

interface ResearcherInput {
  contacts: Array<{
    id: string;
    name: string;
    title: string;
    company_name: string;
    linkedin_url?: string;
    signal_id?: string | null;
  }>;
}

interface Dossier {
  snapshot: {
    title: string;
    tenure: string;
    location: string;
    tools: string[];
    education: string;
  };
  timeline: Array<{ period: string; role: string; notes: string }>;
  public_pov: Array<{ quote_or_summary: string; source_title: string; url: string }>;
  pain_hypotheses: string[];
  hooks: { evidence_first: string; outcome_first: string };
  interests_public: string[];
  personal_public: { marital_status?: string; children_count?: number };
  links: string[];
  quality_score: number;
}

const DOSSIER_PROMPT = `Build a professional dossier for {Name}, {Title} at {Company} using only public sources (company bios, talks, blogs, public LinkedIn post URLs via web search, X/Twitter, conferences, news).
Include JSON:
{
 "snapshot": { "title":"", "tenure":"", "location":"", "tools":[], "education":"" },
 "timeline": [ {"period":"2019–2025","role":"","notes":""}, ... ],
 "public_pov": [ {"quote_or_summary":"","source_title":"","url":""}, ... ],
 "pain_hypotheses": ["...","...","..."],
 "hooks": { "evidence_first":"", "outcome_first":"" },
 "interests_public": ["",""],
 "personal_public": { "marital_status":"", "children_count":0 },
 "links": ["", "..."],
 "quality_score": 0..1
}
Avoid speculation; return only fields you can support with sources.`;

export async function researcher(input: ResearcherInput): Promise<any[]> {
  const { contacts } = input;
  const dossiers = [];

  for (const contact of contacts) {
    try {
      const dossier = await rateLimiter.execute(() =>
        withRetry(
          () => buildDossier(contact),
          {
            maxAttempts: 3,
            delayMs: 2000,
            onRetry: (error, attempt) => {
              console.warn(`Retry ${attempt} for ${contact.name}: ${error.message}`);
            },
          }
        )
      );
      
      dossiers.push({ contact_id: contact.id, signal_id: contact.signal_id ?? null, dossier });

      // Note: Database storage will be handled by API route
    } catch (error) {
      console.error(`Failed to build dossier for ${contact.name}:`, error);
      // Add minimal dossier for failed contacts
      dossiers.push({
        contact_id: contact.id,
        dossier: {
          snapshot: { title: contact.title, tenure: "", location: "", tools: [], education: "" },
          timeline: [],
          public_pov: [],
          pain_hypotheses: [],
          hooks: { evidence_first: "", outcome_first: "" },
          interests_public: [],
          personal_public: {},
          links: [],
          quality_score: 0,
        },
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return dossiers;
}

async function buildDossier(contact: {
  name: string;
  title: string;
  company_name: string;
  linkedin_url?: string;
}): Promise<Dossier> {
  const openrouter = getOpenRouterClient();

  // Gather public sources
  const sources = await gatherPublicSources(contact);

  // Build dossier with LLM
  const prompt = DOSSIER_PROMPT
    .replace("{Name}", contact.name)
    .replace("{Title}", contact.title)
    .replace("{Company}", contact.company_name);

  const response = await openrouter.claude([
    {
      role: "user",
      content: `${prompt}\n\nSources:\n${sources.join("\n\n")}`,
    },
  ], {
    max_tokens: 4000,
  });

  try {
    return JSON.parse(response);
  } catch {
    // Return minimal dossier if parsing fails
    return {
      snapshot: {
        title: contact.title,
        tenure: "",
        location: "",
        tools: [],
        education: "",
      },
      timeline: [],
      public_pov: [],
      pain_hypotheses: [],
      hooks: { evidence_first: "", outcome_first: "" },
      interests_public: [],
      personal_public: {},
      links: [],
      quality_score: 0,
    };
  }
}

async function gatherPublicSources(contact: {
  name: string;
  company_name: string;
  linkedin_url?: string;
}): Promise<string[]> {
  const sources: string[] = [];
  const firecrawl = getFirecrawlClient();

  // Search for company website/about page
  try {
    const companyUrl = `https://www.google.com/search?q=${encodeURIComponent(contact.company_name + ' about')}`;
    const result = await firecrawl.scrapeMarkdown(companyUrl);
    if (result) {
      sources.push(`Company info: ${result.slice(0, 1000)}`);
    }
  } catch (error) {
    console.error('Error gathering company sources:', error);
  }

  // Add LinkedIn if available
  if (contact.linkedin_url) {
    sources.push(`LinkedIn: ${contact.linkedin_url}`);
  }

  // Fallback
  if (sources.length === 0) {
    sources.push(`Public profile: ${contact.name} at ${contact.company_name}`);
  }

  return sources;
}
