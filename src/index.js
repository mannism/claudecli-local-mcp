require('dotenv').config();
const { App } = require('@slack/bolt');
const { askClaude } = require('./claude');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: process.env.USE_SOCKET_MODE === 'true',
  appToken: process.env.SLACK_APP_TOKEN, // only needed in socket mode
});

// Respond to direct messages
app.message(async ({ message, say }) => {
  // Ignore bot messages and non-DM channels unless mentioned
  if (message.subtype || message.bot_id) return;

  console.log(`[DM] ${message.user}: ${message.text}`);

  try {
    const reply = await askClaude(message.text);
    await say(reply);
  } catch (err) {
    console.error('[error]', err);
    await say('Sorry, something went wrong. Please try again.');
  }
});

// Respond to @mentions in channels
app.event('app_mention', async ({ event, say }) => {
  // Strip the @mention prefix from the message
  const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();

  console.log(`[mention] ${event.user}: ${text}`);

  try {
    const reply = await askClaude(text);
    await say({ text: reply, thread_ts: event.ts });
  } catch (err) {
    console.error('[error]', err);
    await say({ text: 'Sorry, something went wrong.', thread_ts: event.ts });
  }
});

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  const mode = process.env.USE_CLI === 'true' ? 'CLI' : 'API';
  const transport = process.env.USE_SOCKET_MODE === 'true' ? 'Socket Mode' : `HTTP :${port}`;
  console.log(`Claude Slack bot running [claude: ${mode}] [transport: ${transport}]`);
})();
