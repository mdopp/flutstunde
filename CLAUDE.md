# Flutstunde — Agent Handbook

This project is a ServiceBay service. Read the following before making changes:

## Must-read ADRs
- `adr-0001` — Auth via Authelia SSO
- `adr-0003` — Releases via release-please only
- `adr-0004` — Installs are non-destructive
- `adr-0007` — Container network isolation
- `adr-0009` — Service tokens and trust
- `adr-0010` — Node LTS line

## Standards
- Read `new-service-architecture` before designing new features
- Read `service-ui-design-standard` before touching the UI
- Read `testing-and-ci-gate` before changing tests

## Commands
- `npm run dev` — Vite dev server
- `npm run build` — Production build
- `npm test` — Test suite
- `npm start` — Production server (Node 22)

## Deployment
1. Commit and push to `main`
2. CI builds image → `ghcr.io/mdopp/flutstunde:latest`
3. Deploy via ServiceBay template (`template/flutstunde/`)
4. Verify with `servicebay verify flutstunde`

## Architecture
- Vite + vanilla JS frontend
- Express.js API server (rate limiting, auth guard)
- Canvas-based game rendering
- AI officer via HTTP to local llama model (port 11435)
- Health check: `/healthz` endpoint
