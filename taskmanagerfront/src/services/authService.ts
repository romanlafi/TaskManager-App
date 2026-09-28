import { API_ENDPOINTS, HTTP_METHODS } from '../config/api';

export const loginUser = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(API_ENDPOINTS.LOGIN, {
    method: HTTP_METHODS.POST,
    body: formData,
  });

  const data = await response.json();
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
