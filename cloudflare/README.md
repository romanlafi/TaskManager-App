# API de TaskManager en Cloudflare Workers

Este workspace contiene la API TypeScript con Hono, la autenticación JWT, las migraciones de Cloudflare D1 y la configuración de Wrangler. El Worker también sirve el frontend compilado en `taskmanagerfront/dist` mediante el binding `ASSETS`.

La [guía principal del proyecto](../README.md) documenta la instalación, la configuración local, las rutas de la API, los tests y el despliegue.

## Comandos del workspace

Los siguientes comandos se ejecutan desde este directorio (`cloudflare/`), una vez configurado `.dev.vars` a partir de `.dev.vars.example`:

| Comando | Función |
| --- | --- |
| `npm run dev` | Instala las dependencias de la raíz, compila el frontend, aplica migraciones locales e inicia Wrangler |
| `npm run build` | Instala las dependencias de la raíz y compila el frontend |
| `npm run typecheck` | Comprueba los tipos de la API sin emitir archivos |
| `npm run db:migrate:local` | Aplica migraciones a la base D1 local |
| `npm run db:migrate:preview` | Aplica migraciones a la base D1 de staging para Workers Previews |
| `npm run db:migrate:remote` | Aplica migraciones a la base D1 de producción |
| `npm run deploy` | Despliega el Worker y los assets compilados mediante Wrangler |

Para desplegar, configura primero el `database_id` de producción en `wrangler.jsonc` y el secreto remoto `JWT_SECRET`. Ejecuta `npm run build`, `npm run db:migrate:remote` y `npm run deploy`, en ese orden.

## Configuración

- `DB`: binding de D1 para usuarios y tareas.
- `ASSETS`: binding para servir el frontend compilado.
- `JWT_SECRET`: secreto local en `.dev.vars`, excluido de Git; en producción se configura con `npx wrangler secret put JWT_SECRET`.
- `JWT_ISSUER`: emisor del token, configurado como `taskmanager-app`.
- `wrangler.preview-migrations.jsonc`: configuración de migraciones para la base independiente `taskmanager-db-staging`, usada por las previews.

Los datos locales de Wrangler se guardan en `.wrangler/`. Para desarrollar la interfaz con recarga automática, ejecuta Vite en otra terminal siguiendo la guía principal; su proxy envía `/api` a `http://127.0.0.1:8799`. El Worker de TaskManager utiliza el puerto 8799 para evitar conflictos con otros proyectos que usan el puerto 8787 predeterminado de Wrangler.
