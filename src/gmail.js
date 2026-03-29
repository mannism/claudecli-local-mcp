'use strict';

require('dotenv').config();
const { google } = require('googleapis');

/**
 * Reads all configured Gmail accounts from env vars (GMAIL_ACCOUNT_1_* through GMAIL_ACCOUNT_3_*).
 * @returns {Array<{ n: number, email: string, alias: string, refreshToken: string, defaultQuery: string }>}
 */
function loadAccounts() {
  const accounts = [];

  for (let n = 1; n <= 3; n++) {
    const email = process.env[`GMAIL_ACCOUNT_${n}_EMAIL`];
    const alias = process.env[`GMAIL_ACCOUNT_${n}_ALIAS`];
    const refreshToken = process.env[`GMAIL_ACCOUNT_${n}_REFRESH_TOKEN`];

    if (!email || !refreshToken) continue;

    accounts.push({
      n,
      email,
      alias: (alias || `account${n}`).toLowerCase(),
      refreshToken,
      defaultQuery: process.env[`GMAIL_ACCOUNT_${n}_DEFAULT_QUERY`] || '',
    });
  }

  return accounts;
}

/**
 * Resolves a user-supplied alias (or email) to a configured account.
 * If aliasOrEmail is null/empty and exactly one account is configured, returns that account.
 *
 * @param {string|null} aliasOrEmail
 * @returns {{ n: number, email: string, alias: string, refreshToken: string, defaultQuery: string }}
 */
function resolveAccount(aliasOrEmail) {
  const accounts = loadAccounts();

  if (!accounts.length) {
    throw new Error(
      'No Gmail accounts configured. Add GMAIL_ACCOUNT_1_EMAIL and GMAIL_ACCOUNT_1_REFRESH_TOKEN to .env.'
    );
  }

  if (!aliasOrEmail) {
    if (accounts.length === 1) return accounts[0];
    const aliases = accounts.map((a) => a.alias).join(', ');
    throw new Error(`Multiple accounts configured. Please specify one: ${aliases}`);
  }

  const needle = aliasOrEmail.toLowerCase();
  const match = accounts.find(
    (a) => a.alias === needle || a.email.toLowerCase() === needle
  );

  if (!match) {
    const aliases = accounts.map((a) => `${a.alias} (${a.email})`).join(', ');
    throw new Error(`Unknown account "${aliasOrEmail}". Available: ${aliases}`);
  }

  return match;
}

/**
 * Builds an authenticated Gmail API client for a specific account.
 * @param {{ refreshToken: string }} account
 * @returns {import('googleapis').gmail_v1.Gmail}
 */
function getGmailClientForAccount(account) {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET } = process.env;

  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
    throw new Error(
      'GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in .env.\n' +
      'Create OAuth 2.0 credentials at console.cloud.google.com.'
    );
  }

  const auth = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: account.refreshToken });
  return google.gmail({ version: 'v1', auth });
}

/**
 * Decodes a base64url-encoded Gmail message part body.
 * @param {string} data
 * @returns {string}
 */
function decodeBody(data) {
  if (!data) return '';
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

/**
 * Extracts plain-text body from a message payload, falling back to snippet.
 * @param {import('googleapis').gmail_v1.Schema$MessagePart} payload
 * @param {string} snippet
 * @returns {string}
 */
function extractBody(payload, snippet) {
  if (!payload) return snippet || '';

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBody(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBody(part.body.data);
      }
    }
    for (const part of payload.parts) {
      const nested = extractBody(part, '');
      if (nested) return nested;
    }
  }

  return snippet || '';
}

/**
 * Fetches emails from a Gmail account using an optional raw Gmail query string.
 * Falls back to the account's default query, then to 'is:unread' if neither is provided.
 *
 * @param {{ n: number, email: string, alias: string, refreshToken: string, defaultQuery: string }} account
 * @param {string|null} rawQuery - raw Gmail query string (e.g. 'label:Important has:attachment')
 * @param {number} [maxResults=30]
 * @returns {Promise<Array<{ subject: string, from: string, date: string, body: string }>>}
 */
async function fetchEmails(account, rawQuery, maxResults = 30) {
  const gmail = getGmailClientForAccount(account);
  const query = rawQuery || account.defaultQuery || 'is:unread';

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults,
  });

  const messages = listRes.data.messages || [];
  if (!messages.length) return [];

  const emails = await Promise.all(
    messages.map(async ({ id }) => {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id,
        format: 'full',
      });

      const headers = msg.data.payload?.headers || [];
      const get = (name) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const body = extractBody(msg.data.payload, msg.data.snippet);

      return {
        subject: get('Subject') || '(no subject)',
        from: get('From'),
        date: get('Date'),
        body: body.slice(0, 500),
      };
    })
  );

  return emails;
}

module.exports = { loadAccounts, resolveAccount, fetchEmails };
