<div style="text-align: center;">
  <img src="taskmanagerfront/src/assets/new_logo_text.webp" alt="TaskManager" width="380">
</div>

[![Quality gate status](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App) [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=coverage)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App) [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App)

TaskManager is a full-stack application for managing personal tasks, built with a **React + TypeScript** frontend and a **Hono API on Cloudflare Workers**, backed by **Cloudflare D1**. The Worker serves both the API and the compiled frontend.

## Features

- Username/password registration and login, with bcrypt password hashing and JWT access tokens.
- Personal task lists: each user can only access their own tasks.
- Create, view, edit and delete tasks with a title, description and optional deadline.
- Three task statuses: `pending`, `in_progress` and `done`.
- Search by title, filter by status and deadline, and sort by creation date, title, status or deadline.
- Configurable result limits, a responsive dashboard with mobile filters, confirmation dialogs and toast notifications.
- Shared TypeScript task definitions across frontend and backend.

## Architecture

| Part | Technologies | Responsibility |
| --- | --- | --- |
| Frontend | React, React Router, Vite, Tailwind CSS, Lucide | Authentication screens, task dashboard and UI components |
| Backend | Cloudflare Workers, Hono, jose, bcryptjs | REST API, JWT authentication, task ownership and static asset serving |
| Database | Cloudflare D1 | Users and tasks, managed with SQL migrations |
| Shared types | `@taskmanager/types` | Task models and status definitions |
| Quality | Vitest, Testing Library, ESLint, SonarQube Cloud | Tests, coverage, linting and CI analysis |

This repository uses **npm workspaces** and a single root `package-lock.json`.

```text
TaskManager-App/
|-- cloudflare/
|   |-- src/
|   |   |-- index.ts                  # Hono app and asset fallback
|   |   |-- auth.ts                   # JWT creation and authentication middleware
|   |   |-- routes/                   # User and task endpoints
|   |   `-- types.ts                  # Worker bindings and database types
|   |-- migrations/                  # Versioned D1 SQL migrations
|   |-- .dev.vars.example            # Local secret template
|   |-- wrangler.jsonc               # Worker, assets and D1 configuration
|   `-- wrangler.preview-migrations.jsonc
|-- taskmanagerfront/
|   |-- src/
|   |   |-- pages/                   # AuthForm and Dashboard
|   |   |-- components/              # Task cards, dialogs, filters and UI controls
|   |   |-- services/                # HTTP clients for authentication and tasks
|   |   |-- config/                  # API endpoints and UI messages
|   |   `-- assets/                  # Application logos
|   `-- vite.config.ts               # React, Tailwind and development API proxy
|-- packages/types/src/index.ts      # Shared task definitions
|-- tests/
|   |-- backend/                     # API tests and SQLite database adapter
|   `-- frontend/                    # Application and component tests
|-- .github/workflows/build.yml      # Tests, coverage and SonarQube analysis
|-- vitest.config.ts
`-- sonar-project.properties
```

## Local development

### Requirements

- **Node.js 24** and npm, matching the CI runtime. Backend tests use `node:sqlite`.
- A Cloudflare account is needed for remote database operations and deployment.

Run the following commands from the **repository root**, unless a section says otherwise.

### 1. Install dependencies

```bash
npm ci
```

This installs all workspaces, including the frontend, Worker and shared types.

### 2. Configure the local secret

Copy the template and replace its placeholder with a long random secret:

```bash
cp cloudflare/.dev.vars.example cloudflare/.dev.vars
```

The resulting file contains:

```dotenv
JWT_SECRET=replace-with-a-long-random-secret
```

`cloudflare/.dev.vars` is ignored by Git. The JWT issuer defaults to `taskmanager-app` and is also configured in `cloudflare/wrangler.jsonc`.

### 3. Start the complete application

```bash
npm run dev --workspace cloudflare
```

This script installs dependencies, builds the frontend, applies local D1 migrations and starts Wrangler. Open [http://localhost:8787](http://localhost:8787), register an account, then log in.

Local D1 state is stored under `cloudflare/.wrangler/` and is separate from the remote database.

### Frontend development with hot reload

Keep the Worker running and start Vite in a second terminal:

```bash
npm run dev --workspace taskmanagerfront
```

Open the URL printed by Vite, normally [http://localhost:5173](http://localhost:5173). Its development proxy forwards `/api` requests to `http://127.0.0.1:8787`.

Wrangler serves the compiled frontend; use Vite for immediate frontend updates while developing.

### Configuration

| Setting | Location | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | `cloudflare/.dev.vars` locally; Worker secret remotely | Signs and verifies JWTs |
| `JWT_ISSUER` | `cloudflare/wrangler.jsonc` | Expected token issuer; defaults to `taskmanager-app` |
| `VITE_API_URL` | Frontend build environment | Optional API base URL, including `/api`; defaults to `/api` |
| `DB` | Wrangler D1 binding | Database used by the API |
| `ASSETS` | Wrangler asset binding | Serves `taskmanagerfront/dist` |

`VITE_API_URL` is compiled into the frontend, so rebuild after changing it. The default supports the Worker deployment and Vite proxy without extra configuration.

## API

All endpoints are under `/api`. Task endpoints require an `Authorization: Bearer <access_token>` header.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Returns `{"status":"ok"}` |
| `POST` | `/api/users/` | Registers a user; returns username and role with HTTP 201 |
| `POST` | `/api/users/token` | Logs in; returns `access_token` and `token_type` |
| `GET` | `/api/tasks/` | Lists the current user's tasks |
| `POST` | `/api/tasks/` | Creates a task with HTTP 201 |
| `GET` | `/api/tasks/{task_id}` | Retrieves one owned task |
| `PUT` | `/api/tasks/{task_id}` | Replaces editable task fields |
| `PATCH` | `/api/tasks/{task_id}` | Updates only supplied task fields |
| `DELETE` | `/api/tasks/{task_id}` | Deletes an owned task |

Registration accepts JSON with `username` and `password`. Login accepts those fields as JSON, URL-encoded form data or multipart form data. Access tokens expire after **30 minutes**; the frontend stores them in `localStorage` and clears the session when loading tasks returns HTTP 401.

### Task payloads

Create and update requests use JSON:

```json
{
  "title": "Prepare the release",
  "description": "Review the checklist",
  "status": "pending",
  "deadline": "2026-10-15"
}
```

A title is required for `POST` and `PUT`. Description defaults to an empty string, status to `pending`, and deadline to `null`. A `PUT` resets omitted optional fields to those defaults; use `PATCH` to preserve fields you do not supply. Send `null` to clear a deadline.

Task responses contain `id`, `title`, `description`, `created_at`, `status` and `deadline`. Error responses use a `detail` field. Missing or inaccessible tasks return HTTP 404.

### Listing parameters

| Parameter | Default | Behavior |
| --- | --- | --- |
| `skip` | `0` | Result offset |
| `limit` | `10` | Number of results, bounded between 1 and 100 |
| `search` | Empty | Case-insensitive title search |
| `status` | No filter | `pending`, `in_progress` or `done` |
| `before_deadline` | No filter | Includes tasks with a deadline on or before the supplied date |
| `order_by` | `created_at` | `created_at`, `title`, `description`, `deadline` or `status`; ascending order |

The endpoint returns a task array. The dashboard offers result limits of 5, 10, 25 and 50; offset pagination is available through the API.

## Build and deploy

### Build

From the repository root:

```bash
npm run build --workspace cloudflare
```

This installs dependencies and builds the frontend into `taskmanagerfront/dist`. The Worker is bundled by Wrangler during deployment.

### Cloudflare setup

For a new Cloudflare account, run these commands from `cloudflare/`:

```bash
cd cloudflare
npx wrangler login
npx wrangler d1 create taskmanager-db
```

Update the production `database_id` in `wrangler.jsonc` with the ID returned by Cloudflare. The checked-in IDs belong to the project's existing databases.

Set the production secret:

```bash
npx wrangler secret put JWT_SECRET
```

### Deploy production

From the repository root, after configuring Cloudflare:

```bash
npm run build --workspace cloudflare
npm run db:migrate:remote --workspace cloudflare
npm run deploy --workspace cloudflare
```

The `deploy` script runs `wrangler deploy`; build the frontend first so that it serves current assets. Remote migrations target the production D1 database.

The repository also configures a separate `taskmanager-db-staging` database for Worker previews. `cloudflare/wrangler.preview-migrations.jsonc` targets that database for preview migrations; update its ID and the preview binding in `wrangler.jsonc` when setting up your own staging database. The GitHub workflow in this repository performs quality checks; it does not deploy the application.

## Tests and quality checks

Run from the repository root:

```bash
npm test
npm run test:watch
npm run test:backend
npm run test:frontend
npm run test:coverage
```

- **Backend:** API and authentication tests run against in-memory SQLite through a D1-compatible adapter, applying the real SQL migrations.
- **Frontend:** jsdom and Testing Library exercise authentication, task management and component behavior with mocked HTTP responses.

Coverage uses V8 and enforces a **95% minimum for statements, branches, functions and lines**. Reports are written to `coverage/index.html`, `coverage/lcov.info` and `coverage/coverage-summary.json`.

Additional checks:

```bash
npm run typecheck --workspace cloudflare
npm run lint --workspace taskmanagerfront
```

### Continuous integration

The `Quality` GitHub Actions workflow runs on pushes to `main` and `staging`, and when pull requests are opened, synchronized or reopened. It uses Node.js 24, installs dependencies with `npm ci`, runs tests with coverage, and submits analysis to SonarQube Cloud using the repository secret `SONAR_TOKEN`.

`sonar-project.properties` configures frontend, backend and shared types as sources, `tests/` as test code, and `coverage/lcov.info` as the JavaScript/TypeScript coverage report.
