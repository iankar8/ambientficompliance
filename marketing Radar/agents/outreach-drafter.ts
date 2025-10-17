/**
 * Outreach-Drafter Agent
 * Generates email/LinkedIn drafts tuned by dossier POV
 */

import { getOpenRouterClient } from "@/lib/integrations/openrouter";

interface DrafterInput {
  contacts: Array<{
    id: string;
    name: string;
    title: string;
    company_name: string;
    dossier: any;
    signal: any;
    signal_id?: string | null;
  }>;
  variant: "initial" | "followup" | "incident_initial";
  attach_evidence?: boolean;
}

const EMAIL_INITIAL_PROMPT = `Audience: {Title} at {Company}. Plain-text only.
≤90 words. Subject ≤4 words. 1 CTA (15-min).
Use: {RadarSummary}. Dossier POV: {TopPOV}. Pain: {PainHypothesis}.
If incident: reference attached evidence (screens/HAR) and "auditable evidence".
Add Calendly token: {CALENDLY_LINK}.
Return:
SUBJECT: ...
BODY:
...`;

const EMAIL_FOLLOWUP_PROMPT = `≤70 words. New angle from dossier (checklist/ROI/demo).
Single question CTA. Plain-text. No fluff.
Return same SUBJECT/BODY format.`;

export async function outreachDrafter(input: DrafterInput): Promise<any[]> {
  const { contacts, variant, attach_evidence } = input;
  const drafts = [];

  for (const contact of contacts) {
    try {
      const draft = await generateDraft(contact, variant, attach_evidence);
      drafts.push({ contact_id: contact.id, signal_id: contact.signal_id ?? null, ...draft });

      // Note: Database storage will be handled by API route
    } catch (error) {
      console.error(`Failed to draft for ${contact.name}:`, error);
    }
  }

  return drafts;
}

async function generateDraft(
  contact: any,
  variant: string,
  attach_evidence?: boolean
): Promise<{ subject: string; body: string }> {
  const openrouter = getOpenRouterClient();
  const CALENDLY_LINK = process.env.CALENDLY_LINK;

  const prompt = variant === "followup" ? EMAIL_FOLLOWUP_PROMPT : EMAIL_INITIAL_PROMPT;

  const contextPrompt = prompt
    .replace("{Title}", contact.title)
    .replace("{Company}", contact.company_name)
    .replace("{RadarSummary}", contact.signal?.title || "")
    .replace("{TopPOV}", contact.dossier?.public_pov?.[0]?.quote_or_summary || "")
    .replace("{PainHypothesis}", contact.dossier?.pain_hypotheses?.[0] || "")
    .replace("{CALENDLY_LINK}", CALENDLY_LINK || "");

  const response = await openrouter.claude([
    {
      role: "user",
      content: contextPrompt,
    },
  ], {
    max_tokens: 500,
  });

  // Parse SUBJECT and BODY
  const subjectMatch = response.match(/SUBJECT:\s*(.+)/);
  const bodyMatch = response.match(/BODY:\s*([\s\S]+)/);

  return {
    subject: subjectMatch?.[1]?.trim() || "Quick question",
    body: bodyMatch?.[1]?.trim() || response,
  };
}
