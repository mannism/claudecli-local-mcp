## [1.0.1](https://github.com/mannism/claudecli-local-mcp/compare/v1.0.0...v1.0.1) (2026-04-30)


### Bug Fixes

* **deps:** bump @anthropic-ai/sdk, axios, follow-redirects for Dependabot alerts ([#9](https://github.com/mannism/claudecli-local-mcp/issues/9)) ([37f85d8](https://github.com/mannism/claudecli-local-mcp/commit/37f85d85220759d7ab3d6a44424ca45819c71797))

# 1.0.0 (2026-04-19)


### Bug Fixes

* align formatter with corrected prompt fields ([85da2e1](https://github.com/mannism/claudecli-local-mcp/commit/85da2e1e4546bb247dc925f8351a2c8a642a3d82))
* bump release workflow Node.js from 20 to 24 ([f21764b](https://github.com/mannism/claudecli-local-mcp/commit/f21764bf054f1cde6d0731a2db9a2e20ff21ebcd))
* rename /inbox slash command to /owner-inbox ([bdc03dc](https://github.com/mannism/claudecli-local-mcp/commit/bdc03dc5e22de14ec4c502de2419b1735c450a15))
* rename TEAM_INBOX_PATH to OWNER_INBOX_PATH in /inbox command ([e4596fa](https://github.com/mannism/claudecli-local-mcp/commit/e4596fafec207a2af3de1c0f63a4490da7f9a8ba))
* render latest_update field in email digest formatter ([95c3255](https://github.com/mannism/claudecli-local-mcp/commit/95c3255559da0f9f4bcc8266441df05ffb46830e))
* restore action field, remove latest_update, clarify stream examples ([3baa554](https://github.com/mannism/claudecli-local-mcp/commit/3baa554d2e8f47e740421bb38583ed25d44c1f38))
* update email formatter to match new prompt field names ([a9dfc92](https://github.com/mannism/claudecli-local-mcp/commit/a9dfc9254a735ac7d300979327dc98848ed0400d))


### Features

* add /digest slash command with account selection and raw query ([923d987](https://github.com/mannism/claudecli-local-mcp/commit/923d987fea5a1a3326422b3800da9a81e98e14a5))
* add /inbox command to scan and prioritise Team Inbox files ([84f6b69](https://github.com/mannism/claudecli-local-mcp/commit/84f6b69e7f4a7e113bcf3ec382e0c7de8f8a01ff))
* add multi-account Gmail support with raw query ([047188a](https://github.com/mannism/claudecli-local-mcp/commit/047188a6673cdd4a28d90db2c8382ab4cce3fc70))
* add OpenAI GPT summarisation with configurable model ([96f7e1e](https://github.com/mannism/claudecli-local-mcp/commit/96f7e1ebd491962496462fd6b4470bb74911ea3a))
* extract GPT system prompts into prompts/ folder ([4f2b074](https://github.com/mannism/claudecli-local-mcp/commit/4f2b0748e53cd82792ed54f19f85e51d888ada63))
* register /digest and /inbox Slack slash command handlers ([f4da7bb](https://github.com/mannism/claudecli-local-mcp/commit/f4da7bb70c5d06ccd43c8a801670f583d679b983))
* restore latest_update field to email-summary prompt ([49d39dd](https://github.com/mannism/claudecli-local-mcp/commit/49d39dd76e0167121b9d38cc4d3e7e2b16169ab5))
* update email-summary prompt with richer context and fields ([1454a15](https://github.com/mannism/claudecli-local-mcp/commit/1454a15bcfcbf2e3c0024fe37e130a21b3b942a0))
