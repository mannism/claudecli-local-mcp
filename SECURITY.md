# Security Policy

## Supported Versions

Only the latest release on `main` receives security patches.

## Reporting a Vulnerability

Please report vulnerabilities privately via email to **security@dianaismail.com**.

Do not open a public GitHub issue for security vulnerabilities.

## Response SLA

- Acknowledged within 48 hours
- Fix targeted within 7 days for critical issues

## Scope

**In scope:**
- Exposed credentials or secrets
- Cross-site scripting (XSS)
- Injection vulnerabilities
- Authentication or authorization bypass
- Data exposure

**Out of scope:**
- Social engineering
- Denial of service against hosted instances
- Issues in third-party dependencies (report upstream)

## Sensitive Data Handled

- Slack workspace messages and user data
- Gmail OAuth credentials (multi-account)
- AI API keys (Anthropic, OpenAI)

## Credential Rotation Guide

| Environment Variable | Rotation Method |
|---|---|
| `SLACK_BOT_TOKEN` | Regenerate in Slack app settings, update `.env` |
| `SLACK_APP_TOKEN` | Regenerate in Slack app settings, update `.env` |
| `ANTHROPIC_API_KEY` | Regenerate in Anthropic console, update `.env` |
| `OPENAI_API_KEY` | Regenerate in OpenAI dashboard, update `.env` |
| Gmail OAuth credentials | Re-run OAuth flow per account |
