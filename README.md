# claudecli-local-mcp

Internal Slack bot that routes messages to Claude — via the local `claude` CLI or the Anthropic API.

---

## How it works

- Responds to **direct messages** and **@mentions** in Slack
- Two Claude modes, switchable via env var:
  - **CLI mode** (`USE_CLI=true`) — shells out to the local `claude` binary; no API key needed, local dev only
  - **API mode** (`USE_CLI=false`) — calls the Anthropic API directly; required for cloud/Railway deployment
- Two Slack transport modes:
  - **Socket Mode** (`USE_SOCKET_MODE=true`) — no tunnel needed, ideal for local development
  - **HTTP mode** — requires a public URL or tunnel (e.g. ngrok) pointing to `PORT`

---

## Prerequisites

- Node.js 20+
- A Slack app with the following scopes: `chat:write`, `app_mentions:read`, `im:history`
- For CLI mode: `claude` CLI installed and authenticated
- For API mode: an Anthropic API key

---

## Setup

```bash
git clone https://github.com/mannism/claudecli-local-mcp.git
cd claudecli-local-mcp
npm install
cp .env.example .env
```

Edit `.env` with your credentials (see table below), then:

```bash
npm run dev
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SLACK_BOT_TOKEN` | Yes | Bot OAuth token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | Yes | Slack app signing secret |
| `USE_SOCKET_MODE` | No | `true` enables Socket Mode (no tunnel needed) |
| `SLACK_APP_TOKEN` | Socket Mode only | App-level token (`xapp-...`) |
| `USE_CLI` | No | `true` = local `claude` CLI, `false` = Anthropic API (default: `true`) |
| `ANTHROPIC_API_KEY` | API mode only | Anthropic API key (`sk-ant-...`) |
| `CLAUDE_MODEL` | No | Model to use in API mode (default: `claude-sonnet-4-6`) |
| `PORT` | No | HTTP port in HTTP mode (default: `3000`) |

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start the bot |
| `npm run dev` | Start with auto-restart on file changes |

---

## Deployment

Set `USE_CLI=false` and provide `ANTHROPIC_API_KEY`. Deploy as a standard Node.js service (Railway, Fly.io, etc.) with the environment variables set in your platform's secret manager.

---

## Releases

Releases are automated via [semantic-release](https://semantic-release.gitbook.io). Merging to `main` triggers the release pipeline which bumps the version, updates `CHANGELOG.md`, and publishes a GitHub release.

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org):

| Prefix | Effect |
|---|---|
| `feat:` | Minor version bump |
| `fix:` | Patch version bump |
| `chore:` / `refactor:` / `docs:` | Patch version bump |
| `BREAKING CHANGE:` in footer | Major version bump |
