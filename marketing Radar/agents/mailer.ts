/**
 * Mailer Agent
 * Sends emails via Gmail API with Calendly link injection
 */

import { getGmailClient } from "@/lib/integrations/gmail";

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

  const gmail = getGmailClient();

  for (const message of messages) {
    try {
      await gmail.sendEmail({
        to: message.to_email,
        subject: message.subject,
        body: message.body,
      });
      
      results.push({
        contact_id: message.contact_id,
        to_email: message.to_email,
        success: true,
      });
      
      console.log(`✅ Email sent to ${message.to_email}`);
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
