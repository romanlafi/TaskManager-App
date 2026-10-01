import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  changeTaskStatus,
  createTask,
  fetchTasks,
} from '../taskmanagerfront/src/services/taskService';
import { HttpError } from '../taskmanagerfront/src/services/http';

afterEach(() => vi.unstubAllGlobals());

function stubSession() {
  vi.stubGlobal('localStorage', { getItem: () => 'test-token' });
}

describe('Task requests', () => {
  it('loads tasks beyond the first API page', async () => {
    stubSession();
    const firstPage = Array.from({ length: 100 }, (_, id) => ({ id }));
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(firstPage)))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 100 }])));
    vi.stubGlobal('fetch', fetch);
    expect(await fetchTasks()).toHaveLength(101);
    expect(fetch.mock.calls[1][0]).toContain('skip=100');
  });

  it('passes cancellation to the request', async () => {
    stubSession();
    const controller = new AbortController();
    const fetch = vi.fn().mockResolvedValue(new Response('[]'));
    vi.stubGlobal('fetch', fetch);
    await fetchTasks(controller.signal);
    expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it('rejects failed writes so the UI cannot report a false success', async () => {
    stubSession();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"detail":"Invalid task priority"}', { status: 400 })),
    );
    await expect(
      createTask({ title: 'Task', description: '', deadline: '', status: 'pending', priority: 'high' }),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('changes only status when moving a card', async () => {
    stubSession();
    const fetch = vi.fn().mockResolvedValue(new Response('{"id":1,"status":"done"}'));
    vi.stubGlobal('fetch', fetch);
    await changeTaskStatus(1, 'done');
    expect(fetch.mock.calls[0][1].method).toBe('PATCH');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ status: 'done' });
  });
});
