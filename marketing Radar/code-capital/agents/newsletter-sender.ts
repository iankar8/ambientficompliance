/**
 * Newsletter Sender
 * Sends Code & Capital newsletter via Resend
 */

import { Resend } from 'resend';
import { supabase } from '../lib/db/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export class NewsletterSender {
  /**
   * Send newsletter to all subscribers
   */
  async sendNewsletter(weekOf: string): Promise<void> {
    console.log(`📧 Sending Code & Capital newsletter for week of ${weekOf}...\n`);

    // Get newsletter
    const { data: newsletter, error: newsletterError } = await supabase
      .from('investor_newsletters')
      .select('*')
      .eq('week_of', weekOf)
      .single();

    if (newsletterError || !newsletter) {
      throw new Error(`Newsletter not found for ${weekOf}`);
    }

    console.log(`✅ Found newsletter: "${newsletter.subject}"\n`);

    // Get active subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('status', 'active');

    if (subscribersError) {
      throw new Error('Failed to fetch subscribers');
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('⚠️  No active subscribers found. Newsletter saved but not sent.');
      return;
    }

    console.log(`📬 Sending to ${subscribers.length} subscribers...\n`);

    // Send emails in batches
    const batchSize = 100; // Resend limit
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(subscriber => 
          this.sendEmail(newsletter, subscriber)
        )
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          sent++;
          console.log(`  ✅ Sent to ${batch[index].email}`);
        } else {
          failed++;
          console.error(`  ❌ Failed to send to ${batch[index].email}:`, result.reason);
        }
      });

      // Rate limiting: wait 1 second between batches
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update newsletter status
    await supabase
      .from('investor_newsletters')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('week_of', weekOf);

    console.log(`\n✅ Newsletter sent!`);
    console.log(`   Sent: ${sent}`);
    console.log(`   Failed: ${failed}`);
  }

  /**
   * Send email to individual subscriber
   */
  private async sendEmail(newsletter: any, subscriber: any): Promise<void> {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'newsletter@codecapital.io';
    const fromName = 'Code & Capital';

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: subscriber.email,
      subject: newsletter.subject,
      html: newsletter.html_content,
      text: newsletter.markdown_content,
      headers: {
        'List-Unsubscribe': `<https://codecapital.io/unsubscribe?email=${subscriber.email}>`,
      },
      tags: [
        { name: 'newsletter', value: 'code-capital' },
        { name: 'week', value: newsletter.week_of }
      ]
    });

    if (error) {
      throw error;
    }

    // Track engagement
    await supabase
      .from('newsletter_engagement')
      .insert({
        newsletter_id: newsletter.id,
        subscriber_id: subscriber.id,
        email_id: data?.id,
        sent_at: new Date().toISOString()
      });
  }

  /**
   * Send test email
   */
  async sendTestEmail(weekOf: string, testEmail: string): Promise<void> {
    console.log(`📧 Sending test email to ${testEmail}...\n`);

    // Get newsletter
    const { data: newsletter, error } = await supabase
      .from('investor_newsletters')
      .select('*')
      .eq('week_of', weekOf)
      .single();

    if (error || !newsletter) {
      throw new Error(`Newsletter not found for ${weekOf}`);
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'newsletter@codecapital.io';
    const fromName = 'Code & Capital';

    const { data, error: sendError } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: testEmail,
      subject: `[TEST] ${newsletter.subject}`,
      html: newsletter.html_content,
      text: newsletter.markdown_content
    });

    if (sendError) {
      throw sendError;
    }

    console.log(`✅ Test email sent! Email ID: ${data?.id}`);
  }
}

// Test if run directly
if (require.main === module) {
  const sender = new NewsletterSender();
  
  (async () => {
    try {
      const weekOf = process.argv[2] || new Date().toISOString().split('T')[0];
      const testEmail = process.argv[3];

      if (testEmail) {
        // Send test email
        await sender.sendTestEmail(weekOf, testEmail);
      } else {
        // Send to all subscribers
        await sender.sendNewsletter(weekOf);
      }
      
    } catch (error) {
      console.error('Failed to send newsletter:', error);
      process.exit(1);
    }
  })();
}
