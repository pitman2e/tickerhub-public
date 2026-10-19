---
name: spawn-test-app
description: Start a development frontend app for troubleshooting difficult issue.
---

- Use the `spawn-test-api` skill to start the isolated test API when needed.
- Start the frontend with `npm run start:test` from `frontend/`. It uses Vite mode `test`, reads `.env.test`, and serves on port 3100 with hot reload.
- Prefer Vite for agent-driven work so the developer can use the same browser session and see live changes. The test Compose stack's Docker `app` service is an optional manual-inspection fallback; do not start it for routine agent work.
- Leave unrelated services on port 3000 untouched.
