![TaskManager](taskmanagerfront/src/assets/new_logo_text.webp)

[![Quality gate status](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App) [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App) [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App)

A task manager with registration, login, and list, board, and monthly calendar views. Tasks have a description, status, priority, and optional deadline. Search, filtering, and sorting work across all three views; board cards can be moved by dragging or by using their status selector.

## Stack and structure

- `taskmanagerfront/`: React 19, TypeScript, React Router, Vite, and Tailwind CSS. `src/main.tsx` mounts the app; `pages/` contains authentication and the dashboard; `components/` contains task views and form controls; `services/` handles HTTP requests and session synchronization.
- `cloudflare/`: a Hono API running on Cloudflare Workers, with a D1 SQLite database. `src/index.ts` mounts the routes and serves the built SPA through the assets binding. SQL and validation stay close to the routes; session and JWT logic have separate modules.
- `packages/types/`: task types shared by the frontend and API.
- `tests/`: Vitest tests for the API, sessions, task filtering, and frontend interactions. Backend tests use an in-memory SQLite database with the real migrations; frontend tests use Testing Library and jsdom.

The repository uses npm workspaces and a single root lockfile. There is no ORM or extra service/repository layer: the application is small enough for parameterized SQL in its routes.

## Run locally

Use **Node.js 24 or later** and run these commands from the repository root:

```sh
npm ci
```

Copy `cloudflare/.dev.vars.example` to `cloudflare/.dev.vars` and set a long, random `JWT_SECRET`. `FRONTEND_ORIGIN=http://localhost:5173` allows the Vite development server; the deployed SPA uses the same origin as the API.

```sh
npm run dev
```

This builds the frontend, applies pending migrations to local D1, and starts the Worker at **http://localhost:8799**. It does not install dependencies or touch the remote database.

For frontend hot reload, leave the Worker running and start another terminal:

```sh
npm run dev:frontend
```

Vite serves the frontend at **http://localhost:5173** and proxies `/api` to the local Worker. API requests use `/api` by default. `taskmanagerfront/.env.example` documents the optional public `VITE_API_URL` setting; never place secrets in `VITE_*` variables.

## Checks

```sh
npm run check          # lint, both TypeScript checks, frontend build, tests and coverage
npm test              # all tests
npm run test:backend
npm run test:frontend
npm run test:watch
```

`npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:coverage` can also be run separately. CI runs the same checks before SonarQube analysis. ESLint covers TypeScript, React hooks, configuration, and tests; no formatter is configured. Coverage reports are generated under `coverage/`, with a 95% minimum for statements, branches, functions, and lines.

## API and sessions

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/users/` | Register |
| POST | `/api/users/token` | Log in with JSON or form credentials |
| POST | `/api/users/refresh` | Renew the access token using the refresh cookie |
| POST | `/api/users/logout` | Revoke the browser session |
| GET, POST | `/api/tasks/` | List or create tasks |
| GET, PUT, PATCH, DELETE | `/api/tasks/:id` | Read, replace, partially update, or delete an owned task |

Task endpoints require `Authorization: Bearer <token>`. Listing supports `skip`, `limit` (up to 100), `search`, `status`, `before_deadline`, and `order_by`. The frontend loads all pages so the board and calendar include every task, then applies shared filters locally.

Access tokens last 30 minutes. Refresh sessions last 30 days and use an HttpOnly, SameSite=Strict cookie, marked Secure over HTTPS; only a hash of the refresh token is stored in D1. Logout revokes the session and its associated access tokens. The frontend coordinates renewal and account changes across tabs using browser storage and discards responses from an old session.

Access tokens are currently cached in `localStorage`, so preventing script injection remains important. React renders task content as text. API writes validate input, queries bind user values, and task queries check ownership. Registration rejects passwords exceeding bcrypt's 72-byte UTF-8 limit. Server exceptions are logged but returned as a generic JSON error. Rate limiting is not implemented in the application and should be considered before exposing public registration to substantial traffic.

## Deploy

See [cloudflare/README.md](cloudflare/README.md) for database configuration, migration commands, and deployment. Deployment is explicit and is not part of local development or checks.
