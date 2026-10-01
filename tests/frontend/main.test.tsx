import { StrictMode } from 'react';
import { expect, it, vi } from 'vitest';
import App from '../../taskmanagerfront/src/App';

const { renderRoot, createRoot } = vi.hoisted(() => {
  const renderRoot = vi.fn();
  return { renderRoot, createRoot: vi.fn(() => ({ render: renderRoot })) };
});
vi.mock('react-dom/client', () => ({ createRoot }));

it('mounts the application in the root container under StrictMode', async () => {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.append(root);
  await import('../../taskmanagerfront/src/main');
  expect(createRoot).toHaveBeenCalledWith(root);
  const element = renderRoot.mock.calls[0][0];
  expect(element.type).toBe(StrictMode);
  expect(element.props.children.type).toBe(App);
  root.remove();
});
