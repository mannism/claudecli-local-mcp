# CLAUDE.md — claudecli-local-mcp

Internal project: Slack bot that proxies messages to Claude via either the local `claude` CLI or the Anthropic API.

---

## Project Overview

| Item | Detail |
|---|---|
| Purpose | Internal MCP Slack setup — Claude-powered Slack bot |
| Runtime | Node.js (CommonJS) |
| Transport | Slack Bolt — HTTP or Socket Mode |
| Claude modes | `USE_CLI=true` → local `claude` CLI / `USE_CLI=false` → Anthropic API |

---

## Project Structure

```
src/
  index.js    — Slack Bolt app; handles DMs and @mentions
  claude.js   — Claude abstraction (CLI or API mode)
.env.example  — Required environment variables
.releaserc.json         — semantic-release config
.github/workflows/release.yml  — GitHub Actions release pipeline
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values. Never commit `.env`.

| Variable | Required | Description |
|---|---|---|
| `SLACK_BOT_TOKEN` | Yes | Bot OAuth token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | Yes | Slack app signing secret |
| `USE_SOCKET_MODE` | No | `true` for Socket Mode (no tunnel needed locally) |
| `SLACK_APP_TOKEN` | Socket Mode only | App-level token (`xapp-...`) |
| `USE_CLI` | No | `true` = local `claude` CLI, `false` = Anthropic API |
| `ANTHROPIC_API_KEY` | API mode only | Anthropic API key (`sk-ant-...`) |
| `CLAUDE_MODEL` | No | Defaults to `claude-sonnet-4-6` |
| `PORT` | No | HTTP port, defaults to `3000` |

---

## Running Locally

```bash
npm install
cp .env.example .env   # fill in values
npm run dev            # node --watch (auto-restart on change)
```

---

## Git Workflow

- **Never commit directly to `main`**
- Branch naming: `<type>/<short-description>` (e.g. `feat/slack-error-handling`)
- Commit format: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, etc.)
- Versioning, CHANGELOG, and tags are fully automated by semantic-release on merge to main

| Type | Version bump |
|---|---|
| `feat:` | Minor (1.0.0 → 1.1.0) |
| `fix:` | Patch (1.0.0 → 1.0.1) |
| `chore:` / `refactor:` / `docs:` | Patch |
| `BREAKING CHANGE:` in footer | Major (1.0.0 → 2.0.0) |

---

## Release Pipeline

Merging to `main` triggers `.github/workflows/release.yml`, which runs `semantic-release` and automatically:
- Bumps `package.json` version
- Generates / updates `CHANGELOG.md`
- Creates a GitHub release with release notes
- Tags the commit (`v1.2.3`)

---

## Code Rules

### Error Handling
- Wrap every Anthropic API call and Slack API call in `try/catch`
- Log failures with metadata: `timestamp`, `service`, `statusCode` — never log tokens or API keys
- On failure, respond to the user with a safe message; never expose stack traces

### Input Validation
- Treat all Slack message text as untrusted input
- Sanitize before passing to shell commands (CLI mode already escapes single quotes)

### Secrets
- All credentials via `.env` only — never hardcode
- `.env` is gitignored

### Code Style
- `camelCase` for functions and variables
- `UPPER_SNAKE_CASE` for constants
- Add JSDoc for any non-obvious logic
