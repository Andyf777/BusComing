# BusComing — Cloudflare Pages deployment

This branch prepares the existing React/Vite bus arrival board for Cloudflare Pages. It does not modify the displayed routes or stop IDs.

## Cloudflare Pages settings

Connect GitHub repository `Andyf777/BusComing` and use:

- Production branch: `main` (after this pull request is merged)
- Framework preset: None
- Root directory: `/` (repository root)
- Build command: `pnpm --filter @workspace/bus-eta run build`
- Build output directory: `artifacts/bus-eta/dist/public`
- Node.js version: 24 (set `NODE_VERSION=24` if required)

The Functions source belongs in `functions/api/[[path]].ts` at the repository root. Requests to `/api/ctb/*`, `/api/kmb/*`, and `/api/gmb/*` are handled by the same-origin Pages Function and forwarded to the public transport data providers. The existing Express server is not required for this bus board.

Use a Cloudflare Pages preview deployment of the feature branch before merging. Verify the page renders and that the API returns real-time JSON (e.g., `/api/ctb/stop/001016`), then merge and promote the main branch. No API keys are necessary for these public transit endpoints.

The build has not yet been verified in Cloudflare. Do not treat this as a completed deployment.
