# Gmail OAuth Setup Guide

This guide walks you through setting up Gmail API access for sending emails.

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name it "Arcana Radar" → Create
4. Wait for project creation (30 seconds)

---

## Step 2: Enable Gmail API

1. In the search bar, type "Gmail API"
2. Click "Gmail API" → Click "Enable"
3. Wait for API to be enabled

---

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" → Create
3. Fill in:
   - App name: `Arcana Radar`
   - User support email: Your email
   - Developer contact: Your email
4. Click "Save and Continue"
5. Scopes: Click "Add or Remove Scopes"
   - Search for `gmail.send`
   - Check `https://www.googleapis.com/auth/gmail.send`
   - Check `https://www.googleapis.com/auth/gmail.readonly`
   - Check `https://www.googleapis.com/auth/gmail.modify`
6. Click "Update" → "Save and Continue"
7. Test users: Add your email address
8. Click "Save and Continue" → "Back to Dashboard"

---

## Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Desktop app"
4. Name: "Arcana Radar Desktop"
5. Click "Create"
6. **IMPORTANT:** Download the JSON file
7. Copy the Client ID and Client Secret

Add to `.env.local`:
```bash
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-your-client-secret
```

---

## Step 5: Get Refresh Token

We need to run an OAuth flow once to get a refresh token.

### Option A: Use the Quick Script (Recommended)

1. Create `scripts/gmail-auth.ts`:

```typescript
import { google } from 'googleapis';
import * as readline from 'readline';

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'http://localhost:3000'
);

const scopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('🔐 Gmail OAuth Setup');
console.log('===================\n');
console.log('1. Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n2. Authorize the app');
console.log('3. Copy the code from the URL (after ?code=)\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ Success! Add this to your .env.local:\n');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\n');
  } catch (error) {
    console.error('❌ Error getting tokens:', error);
  }
  rl.close();
});
```

2. Run it:
```bash
npx tsx scripts/gmail-auth.ts
```

3. Follow the prompts
4. Copy the refresh token to `.env.local`

### Option B: Use OAuth Playground

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) → Check "Use your own OAuth credentials"
3. Enter your Client ID and Client Secret
4. In "Step 1", select:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
5. Click "Authorize APIs"
6. Sign in with your Google account
7. Click "Exchange authorization code for tokens"
8. Copy the "Refresh token"

Add to `.env.local`:
```bash
GMAIL_REFRESH_TOKEN=1//your-refresh-token-here
```

---

## Step 6: Test the Integration

Run the test script:
```bash
npx tsx scripts/test-integrations.ts
```

You should see:
```
✅ Gmail working!
   Found X unread messages
```

---

## Step 7: Send a Test Email

Create `scripts/test-gmail-send.ts`:

```typescript
import { getGmailClient } from '../lib/integrations/gmail';

async function main() {
  const gmail = getGmailClient();
  
  const result = await gmail.sendEmail({
    to: 'your-email@example.com',
    subject: 'Test from Arcana Radar',
    body: 'This is a test email from the Arcana Radar system.\n\nIf you receive this, Gmail integration is working!',
  });
  
  console.log('✅ Email sent!');
  console.log('   Message ID:', result.id);
  console.log('   Thread ID:', result.threadId);
}

main();
```

Run it:
```bash
npx tsx scripts/test-gmail-send.ts
```

Check your inbox!

---

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure you added your email as a test user in OAuth consent screen
- Make sure all scopes are added

### "invalid_grant" error
- Your refresh token expired
- Re-run the OAuth flow to get a new refresh token

### "insufficient permissions"
- Make sure you selected all required scopes
- Re-run OAuth flow with correct scopes

---

## Production Notes

For production (after MVP):
1. Submit app for verification (if sending >100 emails/day)
2. Move from "Testing" to "Production" in OAuth consent screen
3. Consider using a service account for automated sending
4. Set up proper error handling and retry logic

---

## Security

- ✅ Refresh tokens are stored in `.env.local` (gitignored)
- ✅ Never commit credentials to git
- ✅ Rotate refresh tokens periodically
- ✅ Use environment variables in production (Vercel)
