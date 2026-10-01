import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../taskmanagerfront/src/App';
import { MESSAGES } from '../../taskmanagerfront/src/config/messages';
import { testToken } from './helpers/token';

const task = { id: 1, title: 'Existing task', description: 'Details', status: 'pending', deadline: '2026-10-01', created_at: '2026-09-01' };
let fetchMock: ReturnType<typeof vi.fn>;
let sessionToken: string;
let newToken: string;

function reply(data: unknown, status = 200) {
  return { status, json: async () => data };
}

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  fetchMock = vi.fn().mockResolvedValue(reply([]));
  vi.stubGlobal('fetch', fetchMock);
  localStorage.setItem('auth_state', 'out:test');
  sessionToken = testToken();
  newToken = testToken('new-login');
});

async function submitAuth(register = false) {
  const user = userEvent.setup();
  if (register) await user.click(screen.getByRole('button', { name: /Register here/ }));
  await user.type(screen.getByLabelText('Username'), 'alice');
  await user.type(screen.getByLabelText('Password'), 'password');
  await user.click(screen.getByRole('button', { name: register ? 'Register' : 'Log In' }));
}

function dashboard() {
  localStorage.setItem('access_token', sessionToken);
  localStorage.setItem('auth_state', 'in:test');
  window.history.replaceState({}, '', '/dashboard');
  return render(<App />);
}

describe('authentication flows', () => {
  it('redirects unauthenticated users from the dashboard', async () => {
    window.history.replaceState({}, '', '/dashboard');
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Log In' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('logs in, stores the token and loads the dashboard', async () => {
    fetchMock.mockResolvedValueOnce(reply({ access_token: newToken }));
    render(<App />);
    await submitAuth();
    expect(await screen.findByRole('heading', { name: 'My Tasks' })).toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBe(newToken);
    expect(screen.getByText(MESSAGES.LOGIN_SUCCESS)).toBeInTheDocument();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/users/token');
    expect(options.method).toBe('POST');
    expect(options.body.get('username')).toBe('alice');
    expect(options.body.get('password')).toBe('password');
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('/api/tasks/'), expect.objectContaining({ headers: { Authorization: `Bearer ${newToken}` } })));
  });

  it.each([200, 201])('registers with status %s and resets the form', async (status) => {
    fetchMock.mockResolvedValueOnce(reply({ username: 'alice' }, status));
    render(<App />);
    await submitAuth(true);
    expect(await screen.findByText(MESSAGES.REGISTER_SUCCESS)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveValue('');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/api/users/', expect.objectContaining({ method: 'POST', body: JSON.stringify({ username: 'alice', password: 'password' }), headers: { 'Content-Type': 'application/json' } }));
  });

  it.each([
    [400, { detail: 'Required fields' }, 'Required fields'],
    [400, {}, MESSAGES.LOGIN_ERROR],
    [401, { detail: 'Wrong password' }, 'Wrong password'],
    [401, {}, MESSAGES.LOGIN_ERROR],
    [404, { detail: 'Missing account' }, 'Missing account'],
    [404, {}, 'User not found.'],
    [409, {}, MESSAGES.REGISTER_CONFLICT],
    [500, {}, MESSAGES.UNEXPECTED_ERROR],
  ])('shows errors for HTTP %s', async (status, data, message) => {
    fetchMock.mockResolvedValueOnce(reply(data, status));
    render(<App />);
    await submitAuth();
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('shows connection errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    render(<App />);
    await submitAuth();
    expect(await screen.findByText(MESSAGES.SERVER_ERROR)).toBeInTheDocument();
  });
});

describe('dashboard flows', () => {
  it('shows loading before an empty result', async () => {
    let resolve!: (value: unknown) => void;
    fetchMock.mockReturnValueOnce(new Promise((complete) => { resolve = complete; }));
    dashboard();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    resolve(reply([]));
    expect(await screen.findByText('No tasks found.')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('applies search and filters, then resets filters', async () => {
    const user = userEvent.setup();
    dashboard();
    await screen.findByText('No tasks found.');
    await user.type(screen.getByRole('searchbox'), 'some & task');
    await user.selectOptions(screen.getByLabelText('Order by'), 'title');
    await user.selectOptions(screen.getByLabelText('Status'), 'done');
    await user.selectOptions(screen.getByLabelText('Limit'), '25');
    fireEvent.change(screen.getByLabelText('Before deadline'), { target: { value: '2026-10-01' } });
    await waitFor(() => {
      const url = new URL(fetchMock.mock.calls.at(-1)![0], 'http://localhost');
      expect(Object.fromEntries(url.searchParams)).toEqual({ skip: '0', limit: '25', search: 'some & task', order_by: 'title', status: 'done', before_deadline: '2026-10-01' });
    });
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => {
      const params = new URL(fetchMock.mock.calls.at(-1)![0], 'http://localhost').searchParams;
      expect(params.get('order_by')).toBe('created_at');
      expect(params.get('limit')).toBe('10');
      expect(params.has('status')).toBe(false);
      expect(params.has('before_deadline')).toBe(false);
    });
    await user.click(screen.getByRole('button', { name: 'Toggle filters' }));
    expect(document.querySelector('aside')?.className).toContain('max-md:left-0');
    fireEvent.keyDown(document.querySelector('aside')!, { key: 'Escape' });
    expect(document.querySelector('aside')?.className).toContain('max-md:left-[-100%]');
  });

  it('creates a task and refreshes the list', async () => {
    const user = userEvent.setup();
    dashboard();
    await screen.findByText('No tasks found.');
    await user.click(screen.getByRole('button', { name: 'Add Task' }));
    expect(screen.queryByRole('heading', { name: 'Edit Task' })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Title'), 'New task');
    await user.type(screen.getByLabelText('Description'), 'New details');
    fireEvent.change(screen.getByLabelText('Deadline'), { target: { value: '2026-10-01' } });
    fetchMock.mockResolvedValueOnce(reply({ ...task, title: 'New task' }, 201)).mockResolvedValueOnce(reply([{ ...task, title: 'New task' }]));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('heading', { name: 'New task' })).toBeInTheDocument();
    expect(screen.getByText(MESSAGES.TASK_CREATED)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'New Task' })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/', expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: 'New task', description: 'New details', deadline: '2026-10-01' }) }));
  });

  it('edits a task and submits its updated status', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply([task]));
    dashboard();
    await user.click(await screen.findByRole('button', { name: 'Edit task' }));
    expect(screen.getByLabelText('Title')).toHaveValue(task.title);
    expect(screen.getByLabelText('Deadline')).toHaveValue(task.deadline);
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Updated task');
    const modal = screen.getByRole('heading', { name: 'Edit Task' }).parentElement!;
    await user.selectOptions(within(modal).getByLabelText('Status'), 'done');
    fetchMock.mockResolvedValueOnce(reply(task)).mockResolvedValueOnce(reply([{ ...task, title: 'Updated task', status: 'done' }]));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(MESSAGES.TASK_UPDATED)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ title: 'Updated task', description: 'Details', status: 'done', deadline: '2026-10-01' }) }));
    expect(await screen.findByText('Completed', { selector: 'span' })).toBeInTheDocument();
  });

  it('cancels editing and resets the fields for a new task', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply([{ ...task, deadline: null }]));
    dashboard();
    await user.click(await screen.findByRole('button', { name: 'Edit task' }));
    expect(screen.getByLabelText('Deadline')).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Add Task' }));
    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText('Description')).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('requires confirmation to delete a task and refreshes after deletion', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply([task]));
    dashboard();
    await user.click(await screen.findByRole('button', { name: 'Delete task' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Delete task' }));
    fetchMock.mockResolvedValueOnce(reply({})).mockResolvedValueOnce(reply([]));
    await user.click(screen.getByRole('button', { name: 'Delete', exact: true }));
    expect(await screen.findByText(MESSAGES.TASK_DELETED)).toBeInTheDocument();
    expect(await screen.findByText('No tasks found.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({ method: 'DELETE', headers: { Authorization: `Bearer ${sessionToken}` } }));
  });

  it('keeps the task and closes confirmation if deletion fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply([task]));
    dashboard();
    await user.click(await screen.findByRole('button', { name: 'Delete task' }));
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await user.click(screen.getByRole('button', { name: 'Delete', exact: true }));
    expect(await screen.findByText(MESSAGES.UNEXPECTED_ERROR)).toBeInTheDocument();
    expect(screen.queryByText('Are you sure you want to delete this task?')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: task.title })).toBeInTheDocument();
  });

  it.each(['create', 'edit'])('keeps the modal open when %s fails', async (mode) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply([task]));
    dashboard();
    await screen.findByRole('heading', { name: task.title });
    await user.click(screen.getByRole('button', { name: mode === 'create' ? 'Add Task' : 'Edit task' }));
    if (mode === 'create') await user.type(screen.getByLabelText('Title'), 'New task');
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(MESSAGES.SERVER_ERROR)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('reports an unsuccessful load', async () => {
    fetchMock.mockResolvedValueOnce(reply({}, 500));
    dashboard();
    expect(await screen.findByText('Could not fetch tasks.')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('reports a network failure during loading', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    dashboard();
    expect(await screen.findByText(MESSAGES.SERVER_ERROR)).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('clears expired sessions and redirects to login', async () => {
    fetchMock.mockResolvedValueOnce(reply({}, 401)).mockResolvedValueOnce(reply({}, 401));
    dashboard();
    expect(await screen.findByText(MESSAGES.SESSION_EXPIRED_ERROR)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Log In' })).toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('confirms logout and clears the token', async () => {
    const user = userEvent.setup();
    dashboard();
    await screen.findByText('No tasks found.');
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(localStorage.getItem('access_token')).toBe(sessionToken);
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    const modal = screen.getByRole('heading', { name: 'Logout' }).parentElement!;
    fetchMock.mockResolvedValueOnce(reply(null, 204));
    await user.click(within(modal).getByRole('button', { name: 'Log out' }));
    expect(await screen.findByText(MESSAGES.SESSION_ENDED)).toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(window.location.pathname).toBe('/');
  });
});
