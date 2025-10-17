/**
 * Mailer Agent
 * Sends emails via Gmail API with Calendly link injection
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendPlainTextEmail } from "@/lib/gmail/server";

interface MailerInput {
  messages: Array<{
    contact_id: string;
    signal_id?: string | null;
    to_email: string;
    subject: string;
    body: string;
  }>;
}

interface MailerResult {
  contact_id: string;
  to_email: string;
  success: boolean;
  error?: string;
}

export async function mailer(input: MailerInput): Promise<MailerResult[]> {
  const { messages } = input;
  const results: MailerResult[] = [];

  for (const message of messages) {
    try {
      await sendEmail(message);
      await markAsSent(message.contact_id, message.signal_id ?? null);
      results.push({
        contact_id: message.contact_id,
        to_email: message.to_email,
        success: true,
      });
    } catch (error) {
      console.error(`Failed to send email to ${message.to_email}:`, error);
      results.push({
        contact_id: message.contact_id,
        to_email: message.to_email,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

async function sendEmail(message: {
  to_email: string;
  subject: string;
  body: string;
}): Promise<void> {
  await sendPlainTextEmail({
    to: message.to_email,
    subject: message.subject,
    body: message.body,
  });
}

async function markAsSent(contactId: string, signalId: string | null): Promise<void> {
  const supabase = getSupabaseServerClient();

  const outreachUpdate = supabase
    .from("outreach")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("contact_id", contactId)
    .eq("status", "approved");

  if (signalId) {
    outreachUpdate.eq("signal_id", signalId);
  }

  await outreachUpdate; 

  // Update contact state
  await supabase.from("contact_states").insert({
    contact_id: contactId,
    signal_id: signalId,
    state: "INITIAL_SENT",
    updated_at: new Date().toISOString(),
  });
}
