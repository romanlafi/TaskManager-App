const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export const API_ENDPOINTS = {
  USERS: `${BASE_URL}/users/`,
  LOGIN: `${BASE_URL}/users/token`,
  REFRESH: `${BASE_URL}/users/refresh`,
  LOGOUT: `${BASE_URL}/users/logout`,
  TASKS: `${BASE_URL}/tasks/`,
} as const;
