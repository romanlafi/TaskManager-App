# Cloudflare Worker

The Worker serves the Hono API and the compiled frontend from `../taskmanagerfront/dist`. Install dependencies at the repository root; see the [main README](../README.md) for local setup and checks.

## Configuration

`wrangler.jsonc` defines the Worker, its assets binding, and the production and preview D1 databases. Database identifiers are public configuration, not credentials. To use your own Cloudflare account, create the databases and replace the corresponding identifiers and names:

```sh
npx wrangler d1 create taskmanager-db
npx wrangler d1 create taskmanager-db-staging
```

Run these commands from `cloudflare/`. The local server listens on port **8799**, matching the Vite proxy. Local secrets belong in `.dev.vars`, copied from `.dev.vars.example`, and are ignored by Git. Set `FRONTEND_ORIGIN` only when a separate frontend origin needs access; the default deployed SPA uses the API's origin.

## Migrations

From the repository root:

```sh
npm run db:migrate:local --workspace taskmanager-cloudflare
npm run db:migrate:preview --workspace taskmanager-cloudflare
npm run db:migrate:remote --workspace taskmanager-cloudflare
```

The local command updates local D1 only. Preview uses `preview_database_id` for staging; remote updates production. Existing migration names are retained so already applied migrations are not run again. The priority migration preserves existing tasks and assigns medium priority.

## Deployment

After configuring your account and database, run from the repository root:

```sh
npm run check
npm run db:migrate:remote --workspace taskmanager-cloudflare
npm exec --workspace taskmanager-cloudflare -- wrangler secret put JWT_SECRET
npm run deploy --workspace taskmanager-cloudflare
```

Set the JWT secret separately for each deployed environment. Remote migration and deployment commands change Cloudflare resources; they are never executed by `npm run check`.
