import { API_ENDPOINTS, HTTP_METHODS } from '../config/api';
import { assertSession, getSessionState, saveLogin } from './session';

export const loginUser = async (username: string, password: string) => {
  const state = getSessionState();
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(API_ENDPOINTS.LOGIN, {
    method: HTTP_METHODS.POST,
    credentials: 'include',
    body: formData,
  });

  const data = await response.json();
  assertSession(state);
  if (response.status === 200) saveLogin(data.access_token);
  return { status: response.status, data };
};

export const registerUser = async (username: string, password: string) => {
  const response = await fetch(API_ENDPOINTS.USERS, {
    method: HTTP_METHODS.POST,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  return { status: response.status, data };
};
