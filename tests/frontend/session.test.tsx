import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../taskmanagerfront/src/App';
import { useAuth } from '../../taskmanagerfront/src/auth/AuthProvider';
import { authenticatedRequest, HttpError } from '../../taskmanagerfront/src/services/http';
import { createTask, deleteTask, updateTask } from '../../taskmanagerfront/src/services/taskService';
import { assertSession, clearSession, getAccessToken, getSessionState, isCurrentToken, logoutSession, refreshAccessToken, saveLogin, SessionExpiredError, subscribeExpiration, subscribeSession } from '../../taskmanagerfront/src/services/session';
import { MESSAGES } from '../../taskmanagerfront/src/config/messages';
import { testToken } from './helpers/token';
import { loginUser, registerUser } from '../../taskmanagerfront/src/services/authService';

let fetchMock: ReturnType<typeof vi.fn>;
let token: string;
let renewedToken: string;
const task = { id: 1, title: 'Private task', description: '', status: 'pending', priority: 'medium', created_at: '2026-10-01', deadline: null };

function response(data: unknown = {}, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Value>((complete, fail) => { resolve = complete; reject = fail; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  token = testToken();
  renewedToken = testToken('renewed');
  fetchMock = vi.fn().mockImplementation(async (url: string) => url.endsWith('/refresh') ? response({}, 401) : response([]));
  vi.stubGlobal('fetch', fetchMock);
});

function dashboard() {
  saveLogin(token);
  window.history.replaceState({}, '', '/dashboard');
  return render(<App />);
}

describe('restoring and synchronizing authentication', () => {
  it('checks the cookie before showing login and does not warn a new visitor about expiry', async () => {
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent('Restoring session');
    expect(screen.queryByRole('button', { name: 'Log In' })).not.toBeInTheDocument();
    await act(async () => pending.resolve(response({}, 401)));
    expect(await screen.findByRole('button', { name: 'Log In' })).toBeInTheDocument();
    expect(screen.queryByText(MESSAGES.SESSION_EXPIRED_ERROR)).not.toBeInTheDocument();
  });

  it('restores the dashboard from the HttpOnly cookie when storage is empty', async () => {
    fetchMock.mockResolvedValueOnce(response({ access_token: token })).mockResolvedValueOnce(response([task]));
    window.history.replaceState({}, '', '/dashboard');
    render(<App />);
    expect(await screen.findByRole('button', { name: task.title, exact: true })).toBeInTheDocument();
    expect(getAccessToken()).toBe(token);
    expect(window.location.pathname).toBe('/dashboard');
    expect(fetchMock).toHaveBeenCalledWith('/api/users/refresh', { method: 'POST', credentials: 'include' });
  });

  it.each(['expired', 'malformed'])('restores a %s cached access token before requesting tasks', async (mode) => {
    localStorage.setItem('access_token', mode === 'expired' ? testToken('alice', 0) : 'broken');
    localStorage.setItem('auth_state', 'in:previous');
    fetchMock.mockResolvedValueOnce(response({ access_token: token }));
    window.history.replaceState({}, '', '/dashboard');
    render(<App />);
    await screen.findByRole('navigation', { name: 'Task views' });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/users/refresh');
    expect(getAccessToken()).toBe(token);
  });

  it('redirects an already signed-in visitor from login to the dashboard', async () => {
    saveLogin(token);
    render(<App />);
    expect(await screen.findByRole('navigation', { name: 'Task views' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
    expect(fetchMock).not.toHaveBeenCalledWith('/api/users/refresh', expect.anything());
  });

  it.each(['network', 'server', 'invalid-response'])('keeps cached credentials on a %s restoration failure and supports retry', async (mode) => {
    const expired = testToken('alice', 0);
    localStorage.setItem('access_token', expired);
    localStorage.setItem('auth_state', 'in:previous');
    if (mode === 'network') fetchMock.mockRejectedValueOnce(new Error('offline'));
    else fetchMock.mockResolvedValueOnce(mode === 'server' ? response({}, 500) : response({ access_token: 'broken' }));
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not restore');
    expect(getAccessToken()).toBe(expired);
    fetchMock.mockResolvedValueOnce(response({ access_token: token }));
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('navigation', { name: 'Task views' })).toBeInTheDocument();
  });

  it('closes the dashboard immediately on logout in another tab', async () => {
    fetchMock.mockResolvedValueOnce(response([task]));
    dashboard();
    await screen.findByRole('button', { name: task.title, exact: true });
    act(() => {
      localStorage.removeItem('access_token');
      localStorage.setItem('auth_state', 'out:other-tab');
      window.dispatchEvent(new StorageEvent('storage', { key: 'auth_state' }));
    });
    expect(await screen.findByRole('button', { name: 'Log In' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: task.title, exact: true })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('discards the previous account data when another tab logs in with a different account', async () => {
    fetchMock.mockResolvedValueOnce(response([task]));
    dashboard();
    await screen.findByRole('button', { name: task.title, exact: true });
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    act(() => {
      localStorage.setItem('access_token', testToken('bob'));
      localStorage.setItem('auth_state', 'in:bob');
      window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    });
    expect(screen.queryByRole('button', { name: task.title, exact: true })).not.toBeInTheDocument();
    await act(async () => pending.resolve(response([])));
    expect(await screen.findByText('A fresh start')).toBeInTheDocument();
  });

  it('shares one restoration request under StrictMode', async () => {
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    render(<StrictMode><App /></StrictMode>);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve(response({ access_token: token })));
    expect(await screen.findByRole('navigation', { name: 'Task views' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/refresh'))).toHaveLength(1);
  });

  it('renews an expired session when returning to a tab', async () => {
    dashboard();
    await screen.findByText('A fresh start');
    localStorage.setItem('access_token', testToken('alice', 0));
    fetchMock.mockResolvedValueOnce(response({ access_token: renewedToken }));
    fireEvent.focus(window);
    await waitFor(() => expect(getAccessToken()).toBe(renewedToken));
    fireEvent.focus(window);
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/refresh'))).toHaveLength(1);
  });

  it('does not resurrect a locally logged-out session after an offline logout', async () => {
    saveLogin(token);
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(logoutSession()).rejects.toThrow('offline');
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Log In' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it('handles unknown routes with and without a session', async () => {
    clearSession();
    window.history.replaceState({}, '', '/unknown');
    const view = render(<App />);
    expect(await screen.findByRole('button', { name: 'Log In' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
    view.unmount();
    saveLogin(token);
    window.history.replaceState({}, '', '/unknown');
    render(<App />);
    await screen.findByRole('navigation', { name: 'Task views' });
    expect(window.location.pathname).toBe('/dashboard');
  });

  it('ignores an outstanding restoration after unmounting', async () => {
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    const view = render(<App />);
    view.unmount();
    await act(async () => pending.reject(new Error('offline')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('dashboard request failures and ordering', () => {
  async function openMutation(action: string) {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(response([task]));
    dashboard();
    await screen.findByRole('button', { name: task.title, exact: true });
    if (action === 'delete') await user.click(screen.getByRole('button', { name: 'Delete ' + task.title }));
    else {
      await user.click(screen.getByRole('button', { name: action === 'create' ? 'Add Task' : 'Edit ' + task.title }));
      if (action === 'create') await user.type(screen.getByLabelText('Title'), 'New task');
    }
    return user;
  }

  it.each(['create', 'edit', 'delete'])('shows rejected %s operations without a success notification', async (action) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = await openMutation(action);
    fetchMock.mockResolvedValueOnce(response({ detail: 'Operation rejected' }, 403));
    await user.click(screen.getByRole('button', { name: action === 'delete' ? 'Delete' : 'Save', exact: true }));
    expect(await screen.findByText('Operation rejected')).toBeInTheDocument();
    expect(screen.queryByText(MESSAGES.TASK_CREATED)).not.toBeInTheDocument();
    expect(screen.queryByText(MESSAGES.TASK_UPDATED)).not.toBeInTheDocument();
    expect(screen.queryByText(MESSAGES.TASK_DELETED)).not.toBeInTheDocument();
    if (action !== 'delete') expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it.each(['create', 'edit', 'delete'])('redirects to login when the session expires during %s', async (action) => {
    const user = await openMutation(action);
    fetchMock.mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({}, 401));
    await user.click(screen.getByRole('button', { name: action === 'delete' ? 'Delete' : 'Save', exact: true }));
    expect(await screen.findByRole('button', { name: 'Log In' })).toBeInTheDocument();
    expect(screen.getByText(MESSAGES.SESSION_EXPIRED_ERROR)).toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
  });

  it('filters the loaded tasks without racing additional HTTP requests', async () => {
    fetchMock.mockResolvedValueOnce(response([task, { ...task, id: 2, title: 'Newest result' }]));
    dashboard();
    await screen.findByRole('button', { name: task.title, exact: true });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Filters' }));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'old' } });
    expect(screen.queryByRole('button', { name: 'Newest result', exact: true })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'new' } });
    expect(screen.getByRole('button', { name: 'Newest result', exact: true })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports a failed server logout while clearing local authentication', async () => {
    const user = userEvent.setup();
    dashboard();
    await screen.findByText('A fresh start');
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await user.click(screen.getAllByRole('button', { name: 'Log out' })[1]);
    expect(await screen.findByRole('button', { name: 'Log In' })).toBeInTheDocument();
    expect(await screen.findByText(MESSAGES.LOGOUT_ERROR)).toBeInTheDocument();
    expect(screen.queryByText(MESSAGES.SESSION_ENDED)).not.toBeInTheDocument();
  });
});

describe('authenticated HTTP requests', () => {
  beforeEach(() => saveLogin(token));

  it('renews once on 401 and retries with the new token', async () => {
    fetchMock.mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({ access_token: renewedToken })).mockResolvedValueOnce(response([task]));
    expect(await authenticatedRequest('/api/tasks/')).toEqual([task]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(`Bearer ${renewedToken}`);
  });

  it('shares renewal between concurrent requests', async () => {
    const pending = deferred<Response>();
    fetchMock.mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({}, 401)).mockReturnValueOnce(pending.promise)
      .mockImplementation(async () => response([task]));
    const requests = [authenticatedRequest('/api/tasks/'), authenticatedRequest('/api/tasks/1')];
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    pending.resolve(response({ access_token: renewedToken }));
    expect(await Promise.all(requests)).toEqual([[task], [task]]);
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/refresh'))).toHaveLength(1);
  });

  it('uses a token already renewed by another tab without another refresh', async () => {
    fetchMock.mockImplementationOnce(async () => {
      localStorage.setItem('access_token', renewedToken);
      return response({}, 401);
    }).mockResolvedValueOnce(response([]));
    await authenticatedRequest('/api/tasks/');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe(`Bearer ${renewedToken}`);
  });

  it('clears the session if the retry is also unauthorized and never loops', async () => {
    fetchMock.mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({ access_token: renewedToken })).mockResolvedValueOnce(response({}, 401));
    await expect(authenticatedRequest('/api/tasks/')).rejects.toBeInstanceOf(SessionExpiredError);
    expect(getAccessToken()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('clears an expired refresh session and reports one expiration', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeExpiration(listener);
    fetchMock.mockResolvedValueOnce(response({}, 401));
    await expect(refreshAccessToken()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    clearSession(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it.each(['network', 'server', 'invalid'])('preserves the session after a %s renewal failure', async (mode) => {
    const state = getSessionState();
    fetchMock.mockResolvedValueOnce(response({}, 401));
    if (mode === 'network') fetchMock.mockRejectedValueOnce(new Error('offline'));
    else fetchMock.mockResolvedValueOnce(mode === 'server' ? response({}, 500) : response({}));
    await expect(authenticatedRequest('/api/tasks/')).rejects.toThrow();
    expect(getAccessToken()).toBe(token);
    expect(getSessionState()).toBe(state);
  });

  it.each(['logout', 'account-switch'])('discards a renewal completed after %s', async (mode) => {
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    const request = refreshAccessToken();
    if (mode === 'logout') clearSession();
    else saveLogin(testToken('bob'));
    pending.resolve(response({ access_token: renewedToken }));
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    expect(getAccessToken()).not.toBe(renewedToken);
  });

  it('discards an old account response even when its JSON body finishes later', async () => {
    const pending = deferred<unknown>();
    fetchMock.mockResolvedValueOnce({ status: 200, json: () => pending.promise });
    const request = authenticatedRequest('/api/tasks/');
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    saveLogin(testToken('bob'));
    pending.resolve([task]);
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('ignores a refresh body completed after logout', async () => {
    const pending = deferred<unknown>();
    fetchMock.mockResolvedValueOnce({ status: 200, json: () => pending.promise });
    const request = refreshAccessToken();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    clearSession();
    pending.resolve({ access_token: renewedToken });
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    expect(getAccessToken()).toBeNull();
  });

  it('does not retry a cancelled request after renewal', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValueOnce(response({}, 401)).mockImplementationOnce(async () => {
      controller.abort();
      return response({ access_token: renewedToken });
    });
    await expect(authenticatedRequest('/api/tasks/', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ignores an aborted response when fetch does not honor its signal', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementationOnce(async () => { controller.abort(); return response([task]); });
    await expect(authenticatedRequest('/api/tasks/', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });

  it.each(['create', 'update', 'delete'])('rejects unsuccessful %s requests rather than reporting success', async (action) => {
    fetchMock.mockResolvedValueOnce(response({ detail: 'Rejected' }, 403));
    const request = action === 'create' ? createTask({ title: 'Task', description: '', deadline: '', status: 'pending', priority: 'medium' }) : action === 'update' ? updateTask(1, { title: 'Task', description: '', deadline: '', status: 'done', priority: 'medium' }) : deleteTask(1);
    await expect(request).rejects.toMatchObject({ status: 403, message: 'Rejected' });
    expect(getAccessToken()).toBe(token);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(['json', 'html'])('handles a %s server error without a detail field', async (format) => {
    fetchMock.mockResolvedValueOnce(format === 'json' ? response({}, 500) : new Response('<html>', { status: 500 }));
    await expect(authenticatedRequest('/api/tasks/')).rejects.toEqual(new HttpError(500, 'Request failed'));
  });

  it('rejects requests without making HTTP calls after logout', async () => {
    clearSession();
    await expect(authenticatedRequest('/api/tasks/')).rejects.toBeInstanceOf(SessionExpiredError);
    await expect(refreshAccessToken()).rejects.toBeInstanceOf(SessionExpiredError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports logout server errors and discards logout responses after a new login', async () => {
    fetchMock.mockResolvedValueOnce(response({}, 500));
    await expect(logoutSession()).rejects.toThrow('Could not revoke');
    saveLogin(token);
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    const request = logoutSession();
    saveLogin(testToken('bob'));
    pending.resolve(response(null, 204));
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('authentication responses', () => {
  it.each([null, [], 42, { access_token: 42 }, {}])('rejects malformed login responses without saving credentials: %j', async (body) => {
    const previousState = getSessionState();
    fetchMock.mockResolvedValueOnce(response(body));
    await expect(loginUser('alice', 'password')).rejects.toThrow();
    expect(getAccessToken()).toBeNull();
    expect(getSessionState()).toBe(previousState);
  });

  it('rejects a malformed registration response', async () => {
    fetchMock.mockResolvedValueOnce(response(null, 201));
    await expect(registerUser('alice', 'password')).rejects.toThrow('Invalid authentication response');
  });

  it('discards a login completed after another tab changes the session', async () => {
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    const login = loginUser('alice', 'password');
    clearSession();
    pending.resolve(response({ access_token: token }));
    await expect(login).rejects.toMatchObject({ name: 'AbortError' });
    expect(getAccessToken()).toBeNull();
  });
});

describe('session state helpers', () => {
  it('validates expiry and rejects invalid login responses', () => {
    expect(isCurrentToken(null)).toBe(false);
    expect(isCurrentToken('broken')).toBe(false);
    expect(isCurrentToken(testToken('alice', 0))).toBe(false);
    expect(isCurrentToken(token)).toBe(true);
    expect(() => saveLogin('broken')).toThrow('Invalid login response');
    expect(() => assertSession('changed')).toThrow('Session changed');
  });

  it('subscribes to storage changes, ignores unrelated keys and cleans up', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSession(listener);
    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated' }));
    expect(listener).not.toHaveBeenCalled();
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'auth_state' }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'access_token' }));
    clearSession();
    expect(listener).toHaveBeenCalledTimes(4);
    unsubscribe();
    clearSession();
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it('requires an authentication provider', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Consumer() { useAuth(); return null; }
    expect(() => render(<Consumer />)).toThrow('AuthProvider is required');
    error.mockRestore();
  });
});
