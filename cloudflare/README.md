# TaskManager en Cloudflare Workers

Este directorio contiene la API TypeScript, las migraciones D1 y la configuración de despliegue. El Worker sirve también el `dist` generado por `taskmanagerfront`.

## Desarrollo local

```bash
npm install
npm run db:migrate:local
npm run dev
```

El frontend se puede ejecutar en otra terminal con:

```bash
cd ../taskmanagerfront
npm run dev
```

El proxy de Vite envía `/api` a `http://127.0.0.1:8787`.

## Crear y configurar D1

Desde este directorio:

```bash
npx wrangler d1 create taskmanager-db
```

Hay que copiar el `database_id` que devuelve el comando a `wrangler.jsonc`, sustituyendo `REPLACE_WITH_D1_DATABASE_ID`. Después:

```bash
npm run db:migrate:remote
npx wrangler secret put JWT_SECRET
```

Antes de desplegar, generar el frontend:

```bash
cd ../taskmanagerfront
npm run build
cd ../cloudflare
npm run deploy
```

El secreto local está en `.dev.vars` y está excluido por `.gitignore`.
