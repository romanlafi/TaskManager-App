# TaskManager

[![Quality gate status](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App) [![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App) [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=romanlafi_TaskManager-App&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=romanlafi_TaskManager-App)

Full-stack task management app built with **Cloudflare Workers + D1** (backend) and **React + Vite** (frontend).

---

## Features

- User registration and login with JWT authentication
- Task CRUD (Create, Read, Update, Delete)
- SPA frontend served via Cloudflare Assets
- Serverless — no infrastructure to manage

---

## Project Structure

```
taskmanager-app/
├── cloudflare/               # Cloudflare Worker (API + asset serving)
│   ├── src/
│   │   ├── index.ts          # Hono app entry point
│   │   ├── auth.ts           # JWT helpers
│   │   ├── types.ts          # Env + type definitions
│   │   └── routes/
│   │       ├── users.ts      # Auth endpoints
│   │       └── tasks.ts      # Task CRUD endpoints
│   ├── migrations/           # D1 SQL migrations
│   └── wrangler.jsonc
└── taskmanagerfront/         # React + Vite SPA
    └── src/
```

---

## Local Development

### 1. Install dependencies

```bash
cd cloudflare && npm install
```

### 2. Configure secrets

Create `cloudflare/.dev.vars`:

```
JWT_SECRET=your-local-secret
```

### 3. Apply D1 migrations (first time)

```bash
cd cloudflare
npm run db:migrate:local
```

### 4. Run dev server

```bash
npm run dev
```

Builds the frontend and starts Wrangler at [http://localhost:8787](http://localhost:8787).

---

## API Endpoints

### Auth
- `POST /api/users/` — register
- `POST /api/users/token` — login (returns JWT)

### Tasks
- `GET /api/tasks/`
- `POST /api/tasks/`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}`

### Users
- `GET /api/users/me`

---

## Deploy

```bash
cd cloudflare

# Apply migrations to remote D1
npm run db:migrate:remote

# Deploy Worker + assets
npm run deploy
```

Set the JWT secret in production:

```bash
wrangler secret put JWT_SECRET
```

---

## Technologies

- **Cloudflare Workers** — serverless runtime
- **Cloudflare D1** — SQLite-compatible edge database
- **Hono** — lightweight web framework for Workers
- **jose** — JWT signing/verification
- **React + Vite** — frontend SPA
