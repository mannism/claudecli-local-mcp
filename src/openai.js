'use strict';

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const MODEL = process.env.OPENAI_MODEL_SUMMARY || 'gpt-5.2';

const SYSTEM_PROMPT = fs
  .readFileSync(path.join(__dirname, '../prompts/email-summary.md'), 'utf-8')
  .trim();

/**
 * Sends a list of emails to the configured OpenAI model for priority classification and summarisation.
 *
 * @param {Array<{ subject: string, from: string, date: string, body: string }>} emails
 * @returns {Promise<{
 *   blockers: Array<{ subject: string, from: string, summary: string, action: string }>,
 *   high:     Array<{ subject: string, from: string, summary: string, action: string }>,
 *   medium:   Array<{ subject: string, from: string, summary: string, action: string }>,
 *   low:      Array<{ subject: string, from: string, summary: string, action: string }>,
 * }>}
 */
async function summarizeEmails(emails) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const emailList = emails
    .map(
      (e, i) =>
        `Email ${i + 1}:\nFrom: ${e.from}\nDate: ${e.date}\nSubject: ${e.subject}\n\n${e.body}`
    )
    .join('\n\n---\n\n');

  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Please prioritise and summarise these emails:\n\n${emailList}` },
    ],
  });

  const raw = response.choices[0].message.content;
  return JSON.parse(raw);
}

module.exports = { summarizeEmails };
