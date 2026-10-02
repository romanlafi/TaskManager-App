import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../taskmanagerfront/src/App';
import { MESSAGES } from '../../taskmanagerfront/src/config/messages';
import { testToken } from './helpers/token';

const task = { id: 1, title: 'Existing task', description: 'Details', status: 'pending', priority: 'medium', deadline: '2026-10-01', created_at: '2026-09-01' };
let fetchMock: ReturnType<typeof vi.fn>;
let sessionToken: string;
let newToken: string;

function reply(data: unknown, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(data), { status });
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
    expect(await screen.findByRole('navigation', { name: 'Task views' })).toBeInTheDocument();
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
    expect(screen.getByLabelText('Username')).toHaveValue('alice');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/api/users/', expect.objectContaining({ method: 'POST', body: JSON.stringify({ username: 'alice', password: 'password' }), headers: { 'Content-Type': 'application/json' } }));
  });

  it.each([
    [400, { detail: 'Required fields' }, 'Required fields'],
    [400, {}, MESSAGES.LOGIN_ERROR],
    [400, { detail: { internal: 'Invalid input' } }, MESSAGES.LOGIN_ERROR],
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
  it('persists the board view and creates tasks in a selected column', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply([task]));
    const view = dashboard();
    await screen.findByRole('button', { name: task.title, exact: true });
    await user.click(screen.getByRole('button', { name: 'Board', exact: true }));
    expect(localStorage.getItem('task-view')).toBe('board');
    await user.click(screen.getByRole('button', { name: 'Add task to In progress' }));
    expect(screen.getByLabelText('Status')).toHaveValue('in_progress');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    view.unmount();
    fetchMock.mockResolvedValueOnce(reply([task]));
    dashboard();
    expect(await screen.findByRole('region', { name: 'Pending' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit ' + task.title }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Delete ' + task.title }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    fetchMock.mockResolvedValueOnce(reply({ ...task, status: 'done' }));
    await user.selectOptions(screen.getByLabelText('Status for ' + task.title), 'done');
    expect(await screen.findByText(MESSAGES.TASK_UPDATED)).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Completed' })).getByRole('button', { name: task.title, exact: true })).toBeInTheDocument();
    const [, options] = fetchMock.mock.calls.find(([, init]) => init.method === 'PATCH')!;
    expect(JSON.parse(options.body)).toEqual({ status: 'done' });
  });

  it('creates tasks from the calendar date and restores the selected calendar view', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply([{ ...task, deadline: null }]));
    localStorage.setItem('task-view', 'calendar');
    dashboard();
    await screen.findByRole('region', { name: 'Tasks without a deadline' });
    await user.click(screen.getByRole('button', { name: task.title, exact: true }));
    expect(screen.getByRole('dialog', { name: 'Edit Task' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    const addDay = screen.getAllByRole('button', { name: /^Add task due/ })[10];
    const date = addDay.getAttribute('aria-label')!.replace('Add task due ', '');
    await user.click(addDay);
    expect(screen.getByLabelText('Deadline')).toHaveValue(date);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'List', exact: true }));
    expect(localStorage.getItem('task-view')).toBe('list');
  });

  it('retains the status on a rejected change and blocks duplicate changes while saving', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply([task]));
    dashboard();
    const status = await screen.findByLabelText('Status for ' + task.title);
    await user.selectOptions(status, 'pending');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    let finish!: (value: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    await user.selectOptions(status, 'done');
    expect(status).toBeDisabled();
    fireEvent.change(status, { target: { value: 'in_progress' } });
    await user.click(screen.getByRole('button', { name: task.title, exact: true }));
    expect(screen.queryByRole('dialog', { name: 'Edit Task' })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => finish(reply({ detail: 'Cannot change status' }, 403)));
    expect(screen.getByRole('alert')).toHaveTextContent('Cannot change status');
    expect(status).toHaveValue('pending');
    expect(status).not.toBeDisabled();
  });

  it('reopens active filters and clears an empty search result', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply([task]));
    dashboard();
    await screen.findByRole('button', { name: task.title, exact: true });
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.type(screen.getByRole('searchbox'), 'missing');
    await user.click(screen.getByRole('button', { name: 'Filters (1 active)' }));
    await user.click(screen.getByRole('button', { name: /Show search and filters/ }));
    expect(screen.getByRole('searchbox')).toHaveValue('missing');
    await user.click(screen.getByRole('button', { name: 'Clear search and filters' }));
    expect(screen.getByRole('button', { name: task.title, exact: true })).toBeInTheDocument();
  });

  it('retries a failed load and dismisses its notification', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply({}, 500));
    dashboard();
    await screen.findByRole('alert');
    fetchMock.mockResolvedValueOnce(reply([]));
    await user.click(screen.getByRole('button', { name: 'Reload tasks' }));
    await screen.findByText('A fresh start');
    // The real toast timeout also verifies App clears the notification.
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument(), { timeout: 4000 });
    await user.click(screen.getByRole('button', { name: 'Add a task', exact: true }));
    expect(screen.getByRole('dialog', { name: 'New Task' })).toBeInTheDocument();
  });
  it('shows loading before an empty result', async () => {
    let resolve!: (value: unknown) => void;
    fetchMock.mockReturnValueOnce(new Promise((complete) => { resolve = complete; }));
    dashboard();
    expect(screen.getByText('Loading your tasks...')).toBeInTheDocument();
    resolve(reply([]));
    expect(await screen.findByText('A fresh start')).toBeInTheDocument();
    expect(screen.queryByText('Loading your tasks...')).not.toBeInTheDocument();
  });

  it('applies local search and filters, then resets filters', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply([task, { ...task, id: 2, title: 'Other task', status: 'done', priority: 'high' }]));
    dashboard();
    await screen.findByRole('button', { name: task.title, exact: true });
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.type(screen.getByRole('searchbox'), 'Other');
    await user.selectOptions(screen.getByLabelText('Sort tasks'), 'title');
    await user.selectOptions(screen.getByLabelText('Status'), 'done');
    await user.selectOptions(screen.getByLabelText('Priority'), 'high');
    fireEvent.change(screen.getByLabelText('Due on or before'), { target: { value: '2026-10-01' } });
    expect(screen.getByRole('button', { name: 'Other task', exact: true })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: task.title, exact: true })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(screen.getByRole('button', { name: task.title, exact: true })).toBeInTheDocument();
    expect(screen.getByLabelText('Sort tasks')).toHaveValue('priority');
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('creates a task and refreshes the list', async () => {
    const user = userEvent.setup();
    dashboard();
    await screen.findByText('A fresh start');
    await user.click(screen.getByRole('button', { name: 'Add Task' }));
    expect(screen.queryByRole('heading', { name: 'Edit Task' })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Title'), 'New task');
    await user.type(screen.getByLabelText('Description'), 'New details');
    fireEvent.change(screen.getByLabelText('Deadline'), { target: { value: '2026-10-01' } });
    fetchMock.mockResolvedValueOnce(reply({ ...task, title: 'New task' }, 201)).mockResolvedValueOnce(reply([{ ...task, title: 'New task' }]));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('button', { name: 'New task', exact: true })).toBeInTheDocument();
    expect(screen.getByText(MESSAGES.TASK_CREATED)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'New Task' })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/', expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: 'New task', description: 'New details', deadline: '2026-10-01', status: 'pending', priority: 'medium' }) }));
  });

  it('edits a task and submits its updated status', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply([task]));
    dashboard();
    await user.click(await screen.findByRole('button', { name: 'Edit ' + task.title }));
    expect(screen.getByLabelText('Title')).toHaveValue(task.title);
    expect(screen.getByLabelText('Deadline')).toHaveValue(task.deadline);
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Updated task');
    const modal = screen.getByRole('dialog', { name: 'Edit Task' });
    await user.selectOptions(within(modal).getByLabelText('Status'), 'done');
    fetchMock.mockResolvedValueOnce(reply({ ...task, title: 'Updated task', status: 'done' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(MESSAGES.TASK_UPDATED)).toBeInTheDocument();
    const [, options] = fetchMock.mock.calls.find(([url, init]) => url === '/api/tasks/1' && init.method === 'PUT')!;
    expect(JSON.parse(options.body)).toEqual({ title: 'Updated task', description: 'Details', status: 'done', deadline: '2026-10-01', priority: 'medium' });
    expect(await screen.findByRole('combobox', { name: 'Status for Updated task' })).toHaveValue('done');
  });

  it('cancels editing and resets the fields for a new task', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply([{ ...task, deadline: null }]));
    dashboard();
    await user.click(await screen.findByRole('button', { name: 'Edit ' + task.title }));
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
    await user.click(await screen.findByRole('button', { name: 'Delete ' + task.title }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Delete ' + task.title }));
    fetchMock.mockResolvedValueOnce(reply({})).mockResolvedValueOnce(reply([]));
    await user.click(screen.getByRole('button', { name: 'Delete', exact: true }));
    expect(await screen.findByText(MESSAGES.TASK_DELETED)).toBeInTheDocument();
    expect(await screen.findByText('A fresh start')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({ method: 'DELETE', headers: { Authorization: `Bearer ${sessionToken}` } }));
  });

  it('keeps the task and confirmation open if deletion fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply([task]));
    dashboard();
    await user.click(await screen.findByRole('button', { name: 'Delete ' + task.title }));
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await user.click(screen.getByRole('button', { name: 'Delete', exact: true }));
    expect(await screen.findByText(MESSAGES.SERVER_ERROR)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete', exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: task.title, exact: true })).toBeInTheDocument();
  });

  it.each(['create', 'edit'])('keeps the modal open when %s fails', async (mode) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(reply([task]));
    dashboard();
    await screen.findByRole('button', { name: task.title, exact: true });
    await user.click(screen.getByRole('button', { name: mode === 'create' ? 'Add Task' : 'Edit ' + task.title }));
    if (mode === 'create') await user.type(screen.getByLabelText('Title'), 'New task');
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(MESSAGES.SERVER_ERROR)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('reports an unsuccessful load', async () => {
    fetchMock.mockResolvedValueOnce(reply({}, 500));
    dashboard();
    expect(await screen.findByRole('button', { name: 'Reload tasks' })).toBeInTheDocument();
    expect(screen.queryByText('Loading your tasks...')).not.toBeInTheDocument();
  });

  it('reports a network failure during loading', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    dashboard();
    expect(await screen.findByText(MESSAGES.SERVER_ERROR)).toBeInTheDocument();
    expect(screen.queryByText('Loading your tasks...')).not.toBeInTheDocument();
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
    await screen.findByText('A fresh start');
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
