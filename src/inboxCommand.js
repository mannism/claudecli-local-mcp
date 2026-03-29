'use strict';

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const MODEL = process.env.OPENAI_MODEL || 'gpt-5.2';

const INBOX_SYSTEM_PROMPT = fs
  .readFileSync(path.join(__dirname, '../prompts/inbox-analysis.md'), 'utf-8')
  .trim();

/**
 * Scans the Team Inbox directory and returns file metadata.
 * @param {string} inboxPath
 * @returns {Array<{ name: string, sizeKb: number, modifiedAt: string }>}
 */
function scanInbox(inboxPath) {
  if (!inboxPath) {
    throw new Error(
      'OWNER_INBOX_PATH is not set in .env. Add the path to the folder where your team drops files for you.'
    );
  }

  if (!fs.existsSync(inboxPath)) {
    throw new Error(`Team Inbox directory not found: ${inboxPath}`);
  }

  const entries = fs.readdirSync(inboxPath, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile())
    .map((e) => {
      const stat = fs.statSync(path.join(inboxPath, e.name));
      return {
        name: e.name,
        sizeKb: Math.round(stat.size / 1024),
        modifiedAt: stat.mtime.toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric',
        }),
      };
    });

  return files;
}

/**
 * Sends file list to the configured OpenAI model for priority analysis.
 * @param {Array<{ name: string, sizeKb: number, modifiedAt: string }>} files
 * @returns {Promise<Array<{ name: string, priority: string, suggestedAction: string }>>}
 */
async function analyseInbox(files) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const fileList = files
    .map((f) => `- ${f.name} (${f.sizeKb}KB, last modified ${f.modifiedAt})`)
    .join('\n');

  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: INBOX_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Please review these Team Inbox files and suggest priorities:\n\n${fileList}\n\nReturn as JSON array with key "items".`,
      },
    ],
  });

  const raw = JSON.parse(response.choices[0].message.content);
  // Prompt asks for { "items": [...] }; fall back gracefully if shape differs
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.items)) return raw.items;
  const firstKey = Object.keys(raw)[0];
  return Array.isArray(raw[firstKey]) ? raw[firstKey] : [];
}

/**
 * Formats analysed inbox items into a Slack mrkdwn string.
 * @param {Array<{ name: string, priority: string, suggestedAction: string }>} items
 * @returns {string}
 */
function formatInboxBlocks(items) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  if (!items || items.length === 0) {
    return `📂 *Team Inbox — ${today}*\n\n✅ Team Inbox is clear — nothing pending.`;
  }

  const EMOJI = { high: '🔴', medium: '🟡', low: '🟢' };
  const order = ['high', 'medium', 'low'];

  const grouped = { high: [], medium: [], low: [] };
  for (const item of items) {
    const bucket = grouped[item.priority] ? item.priority : 'low';
    grouped[bucket].push(item);
  }

  const sections = [`📂 *Team Inbox — ${today}* · ${items.length} item${items.length === 1 ? '' : 's'}`];

  for (const priority of order) {
    const bucket = grouped[priority];
    if (!bucket.length) continue;
    const label = priority.charAt(0).toUpperCase() + priority.slice(1);
    const lines = bucket.map(
      (item) => `• *${item.name}*\n  *Action:* ${item.suggestedAction}`
    );
    sections.push(`${EMOJI[priority]} *${label.toUpperCase()}* (${bucket.length})\n${lines.join('\n\n')}`);
  }

  return sections.join('\n\n' + '─'.repeat(30) + '\n\n');
}

/**
 * Handles the /inbox slash command end-to-end.
 * @param {Function} respond - Slack respond function
 */
async function handleInboxCommand(respond) {
  const inboxPath = process.env.OWNER_INBOX_PATH;
  const files = scanInbox(inboxPath);

  if (files.length === 0) {
    await respond('📂 *Owner Inbox*\n\n✅ Nothing pending — no files from the team.');
    return;
  }

  const analysed = await analyseInbox(files);
  const message = formatInboxBlocks(analysed);
  await respond(message);
}

module.exports = { handleInboxCommand, scanInbox, formatInboxBlocks };
