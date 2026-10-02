import { API_ENDPOINTS } from '../config/api';
import { assertSession, getSessionState, saveLogin } from './session';

interface AuthResponse {
  access_token?: string;
  detail?: string;
}

async function readAuthResponse(response: Response): Promise<AuthResponse> {
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid authentication response');
  return {
    access_token: 'access_token' in body && typeof body.access_token === 'string' ? body.access_token : undefined,
    detail: 'detail' in body && typeof body.detail === 'string' ? body.detail : undefined,
  };
}

export const loginUser = async (username: string, password: string) => {
  const state = getSessionState();
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(API_ENDPOINTS.LOGIN, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await readAuthResponse(response);
  assertSession(state);
  if (response.status === 200) {
    if (!data.access_token) throw new Error('Missing access token');
    saveLogin(data.access_token);
  }
  return { status: response.status, data };
};

export const registerUser = async (username: string, password: string) => {
  const response = await fetch(API_ENDPOINTS.USERS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await readAuthResponse(response);
  return { status: response.status, data };
};
