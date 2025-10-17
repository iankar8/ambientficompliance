/**
 * Gmail Integration
 * Send emails and listen for replies
 */

import { google } from 'googleapis';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
}

export class GmailClient {
  private oauth2Client: any;
  private gmail: any;

  constructor() {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Gmail credentials not found in environment variables');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:3000/api/auth/gmail/callback'
    );

    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  private createMessage(options: EmailOptions): string {
    const { to, subject, body, from, replyTo } = options;
    
    const messageParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      from ? `From: ${from}` : '',
      replyTo ? `Reply-To: ${replyTo}` : '',
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].filter(Boolean);

    const message = messageParts.join('\n');
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async sendEmail(options: EmailOptions): Promise<{ id: string; threadId: string }> {
    try {
      const raw = this.createMessage(options);
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw,
        },
      });

      return {
        id: response.data.id,
        threadId: response.data.threadId,
      };
    } catch (error: any) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async getUnreadMessages(maxResults: number = 10): Promise<any[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults,
      });

      if (!response.data.messages) {
        return [];
      }

      const messages = await Promise.all(
        response.data.messages.map(async (message: any) => {
          const msg = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });
          return msg.data;
        })
      );

      return messages;
    } catch (error: any) {
      throw new Error(`Failed to get unread messages: ${error.message}`);
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to mark message as read: ${error.message}`);
    }
  }

  async addLabel(messageId: string, labelName: string): Promise<void> {
    try {
      // First, get or create the label
      const labelsResponse = await this.gmail.users.labels.list({
        userId: 'me',
      });

      let labelId = labelsResponse.data.labels?.find(
        (label: any) => label.name === labelName
      )?.id;

      if (!labelId) {
        const createResponse = await this.gmail.users.labels.create({
          userId: 'me',
          requestBody: {
            name: labelName,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show',
          },
        });
        labelId = createResponse.data.id;
      }

      // Add the label to the message
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId],
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to add label: ${error.message}`);
    }
  }

  async watchInbox(callback: (message: any) => void): Promise<void> {
    // Set up Gmail push notifications (requires Pub/Sub setup)
    // For MVP, we'll use polling instead
    setInterval(async () => {
      const messages = await this.getUnreadMessages(5);
      messages.forEach(callback);
    }, 60000); // Check every minute
  }
}

// Singleton instance
let gmailClient: GmailClient | null = null;

export function getGmailClient(): GmailClient {
  if (!gmailClient) {
    gmailClient = new GmailClient();
  }
  return gmailClient;
}
