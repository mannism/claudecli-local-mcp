'use strict';

const { resolveAccount, fetchEmails } = require('./gmail');
const { summarizeEmails } = require('./openai');

/**
 * Parses the slash command body into an account alias and optional raw Gmail query.
 * The first whitespace-delimited token is treated as the account alias.
 * Everything after it is the raw Gmail query.
 *
 * Examples:
 *   ""                               → { alias: null, query: null }
 *   "diana"                          → { alias: 'diana', query: null }
 *   "diana label:Important"          → { alias: 'diana', query: 'label:Important' }
 *   "diana has:attachment is:unread" → { alias: 'diana', query: 'has:attachment is:unread' }
 *
 * @param {string} text - raw text after the slash command
 * @returns {{ alias: string|null, query: string|null }}
 */
function parseDigestArgs(text) {
  if (!text || !text.trim()) return { alias: null, query: null };

  const parts = text.trim().split(/\s+/);
  const alias = parts[0] || null;
  const query = parts.length > 1 ? parts.slice(1).join(' ') : null;

  return { alias, query };
}

/**
 * Formats a single prioritised email entry.
 * @param {{ subject: string, from: string, stream: string, summary: string, latest_update: string, action: string|null }} email
 * @returns {string}
 */
function formatEntry(email) {
  const lines = [
    `• *${email.subject}* — ${email.from}`,
    `  _${email.stream || 'General'}_`,
    `  ${email.summary}`,
  ];
  if (email.latest_update) {
    lines.push(`  *Latest:* ${email.latest_update}`);
  }
  if (email.action) {
    lines.push(`  *Action:* ${email.action}`);
  }
  return lines.join('\n');
}

/**
 * Builds the full Slack mrkdwn response from categorised emails.
 * The header includes the Gmail account address the digest is for.
 *
 * @param {{ blockers: Array, high: Array, medium: Array, low: Array }} categorized
 * @param {string} accountEmail - the Gmail address fetched from
 * @returns {string}
 */
function formatSlackResponse(categorized, accountEmail) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  const total =
    (categorized.blockers?.length || 0) +
    (categorized.high?.length || 0) +
    (categorized.medium?.length || 0) +
    (categorized.low?.length || 0);

  if (total === 0) {
    return `📧 *Email Digest — ${accountEmail} — ${today}*\n\n✅ Inbox is clear — no emails found matching your query.`;
  }

  const renderSection = (emoji, label, items) => {
    if (!items || items.length === 0) {
      return `${emoji} *${label}* (0)\n_Nothing here._`;
    }
    return `${emoji} *${label}* (${items.length})\n${items.map(formatEntry).join('\n\n')}`;
  };

  const sections = [
    `📧 *Email Digest — ${accountEmail} — ${today}* · ${total} email${total === 1 ? '' : 's'}`,
    renderSection('🚨', 'BLOCKERS', categorized.blockers),
    renderSection('🔴', 'HIGH PRIORITY', categorized.high),
    renderSection('🟡', 'MEDIUM PRIORITY', categorized.medium),
    renderSection('🟢', 'LOW PRIORITY', categorized.low),
  ];

  return sections.join('\n\n' + '─'.repeat(30) + '\n\n');
}

/**
 * Handles the /digest slash command end-to-end.
 * @param {string} commandText - text after /digest
 * @param {Function} respond - Slack respond function
 */
async function handleEmailCommand(commandText, respond) {
  const { alias, query } = parseDigestArgs(commandText);
  const account = resolveAccount(alias);
  const emails = await fetchEmails(account, query);

  if (emails.length === 0) {
    await respond(
      `📧 *Email Digest — ${account.email}*\n\n✅ No emails found. Inbox is clear!`
    );
    return;
  }

  const categorized = await summarizeEmails(emails);
  const message = formatSlackResponse(categorized, account.email);
  await respond(message);
}

module.exports = { handleEmailCommand, parseDigestArgs, formatSlackResponse };
