const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const USE_CLI = process.env.USE_CLI === 'true';

async function askClaude(message) {
  if (USE_CLI) {
    return askViaCLI(message);
  } else {
    return askViaAPI(message);
  }
}

async function askViaCLI(message) {
  // Sanitize message to prevent shell injection
  const sanitized = message.replace(/'/g, "'\\''");
  const { stdout, stderr } = await execAsync(`claude -p '${sanitized}' --output-format text < /dev/null`);
  if (stderr) console.error('[claude cli stderr]', stderr);
  return stdout.trim();
}

async function askViaAPI(message) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: message }],
  });

  return response.content[0].text;
}

module.exports = { askClaude };
