/**
 * Outreach-Drafter Agent
 * Generates email/LinkedIn drafts tuned by dossier POV
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";

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

      // Store in database
      await storeDraft(contact.id, draft, contact.signal_id ?? null);
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
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const CALENDLY_LINK = process.env.CALENDLY_LINK;

  const prompt = variant === "followup" ? EMAIL_FOLLOWUP_PROMPT : EMAIL_INITIAL_PROMPT;

  const contextPrompt = prompt
    .replace("{Title}", contact.title)
    .replace("{Company}", contact.company_name)
    .replace("{RadarSummary}", contact.signal?.title || "")
    .replace("{TopPOV}", contact.dossier?.public_pov?.[0]?.quote_or_summary || "")
    .replace("{PainHypothesis}", contact.dossier?.pain_hypotheses?.[0] || "")
    .replace("{CALENDLY_LINK}", CALENDLY_LINK || "");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: contextPrompt,
        },
      ],
    }),
  });

  const data = await response.json();
  const content = data.content[0]?.text || "";

  // Parse SUBJECT and BODY
  const subjectMatch = content.match(/SUBJECT:\s*(.+)/);
  const bodyMatch = content.match(/BODY:\s*([\s\S]+)/);

  return {
    subject: subjectMatch?.[1]?.trim() || "Quick question",
    body: bodyMatch?.[1]?.trim() || content,
  };
}

async function storeDraft(
  contactId: string,
  draft: { subject: string; body: string },
  signalId: string | null
): Promise<void> {
  const supabase = getSupabaseServerClient();

  await supabase.from("outreach").insert({
    contact_id: contactId,
    signal_id: signalId,
    channel: "email",
    subject: draft.subject,
    body: draft.body,
    status: "draft",
  });

  // Update contact state
  await supabase.from("contact_states").insert({
    contact_id: contactId,
    signal_id: signalId,
    state: "INITIAL_DRAFTED",
    updated_at: new Date().toISOString(),
  });
}
