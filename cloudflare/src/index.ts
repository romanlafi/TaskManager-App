import { Hono } from 'hono';
import { cors } from 'hono/cors';
import users from './routes/users';
import tasks from './routes/tasks';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', cors({ origin: '*' }));
app.get('/api/health', (c) => c.json({ status: 'ok' }));
app.route('/api', users);
app.route('/api', tasks);

app.notFound(async (c) => {
  if (c.req.path === '/api' || c.req.path.startsWith('/api/')) {
    return c.json({ detail: 'Not found' }, 404);
  }
  if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req.raw);
  return c.json({ detail: 'Not found' }, 404);
});

app.onError((error, c) => {
  console.error(error);
  return c.json({ detail: 'Internal server error' }, 500);
});

export default app;
