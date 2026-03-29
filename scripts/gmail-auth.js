/**
 * One-time Gmail OAuth2 setup script.
 * Run with: node scripts/gmail-auth.js --account 1
 *
 * Defaults to --account 1 if flag is omitted.
 * Paste the printed GMAIL_ACCOUNT_N_REFRESH_TOKEN into your .env file.
 *
 * Prerequisites:
 *   - GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in .env
 *   - Google Cloud project with Gmail API enabled
 *   - OAuth 2.0 credentials with redirect URI: http://localhost:3000/oauth2callback
 */
require('dotenv').config();
const { google } = require('googleapis');
const http = require('http');
const url = require('url');

// Parse --account N from argv (default: 1)
const accountFlagIdx = process.argv.indexOf('--account');
const accountN = accountFlagIdx !== -1 ? parseInt(process.argv[accountFlagIdx + 1], 10) : 1;

if (![1, 2, 3].includes(accountN)) {
  console.error('Error: --account must be 1, 2, or 3');
  process.exit(1);
}

const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET } = process.env;

if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
  console.error('Error: GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in .env');
  process.exit(1);
}

const accountEmail = process.env[`GMAIL_ACCOUNT_${accountN}_EMAIL`];
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const oauth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
});

const accountLabel = accountEmail
  ? `Account ${accountN} (${accountEmail})`
  : `Account ${accountN}`;

console.log(`\nAuthorising ${accountLabel}\n`);
console.log('Open this URL in your browser:\n');
console.log(authUrl);
console.log('\nWaiting for OAuth callback on http://localhost:3000/oauth2callback ...\n');

/** Temporary local server to capture the OAuth callback code */
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname !== '/oauth2callback') {
    res.end('Not found');
    return;
  }

  const code = parsed.query.code;
  if (!code) {
    res.end('No code in callback. Please try again.');
    server.close();
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.end('<h2>Success! You can close this tab.</h2><p>Check your terminal for the refresh token.</p>');

    console.log(`\n✅ Authorisation successful for ${accountLabel}!\n`);
    console.log('Add the following to your .env file:\n');
    console.log(`GMAIL_ACCOUNT_${accountN}_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\nDone. You can stop this script with Ctrl+C.\n');
  } catch (err) {
    res.end('Error exchanging code for tokens. Check terminal.');
    console.error('Token exchange error:', err.message);
  }

  server.close();
});

server.listen(3000);
