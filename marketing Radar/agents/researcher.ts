/**
 * Researcher Agent
 * Builds person-level dossiers from public sources
 */

import { withRetry, RateLimiter } from "@/lib/retry";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

      // Store in database
      await storeDossier(contact.id, dossier, contact.signal_id ?? null);
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
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  // Gather public sources
  const sources = await gatherPublicSources(contact);

  // Build dossier with LLM
  const prompt = DOSSIER_PROMPT
    .replace("{Name}", contact.name)
    .replace("{Title}", contact.title)
    .replace("{Company}", contact.company_name);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nSources:\n${sources.join("\n\n")}`,
        },
      ],
    }),
  });

  const data = await response.json();
  const content = data.content[0]?.text;

  try {
    return JSON.parse(content);
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

  // Google search for public info
  const searchQueries = [
    `"${contact.name}" ${contact.company_name}`,
    `"${contact.name}" interview`,
    `"${contact.name}" conference talk`,
  ];

  // TODO: Implement web search via Firecrawl or Google Custom Search API
  // For now, return placeholder
  sources.push(`Public profile: ${contact.name} at ${contact.company_name}`);

  return sources;
}

async function storeDossier(
  contactId: string,
  dossier: Dossier,
  signalId: string | null = null
): Promise<void> {
  const supabase = getSupabaseServerClient();

  await supabase.from("dossiers").upsert({
    contact_id: contactId,
    compiled_at: new Date().toISOString(),
    snapshot: dossier.snapshot,
    timeline: dossier.timeline,
    public_pov: dossier.public_pov,
    pain_hypotheses: dossier.pain_hypotheses,
    hooks: dossier.hooks,
    interests_public: dossier.interests_public,
    personal_public: dossier.personal_public,
    links: dossier.links,
    quality_score: dossier.quality_score,
  });

  // Update contact state
  await supabase.from("contact_states").insert({
    contact_id: contactId,
    signal_id: signalId,
    state: "PERSON_DOSSIER",
    updated_at: new Date().toISOString(),
  });
}
