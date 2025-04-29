const BASE_URL = "http://127.0.0.1:8000";

export const API_ENDPOINTS = {
    USERS: `${BASE_URL}/users`,
    LOGIN: `${BASE_URL}/users/token`,
    TASKS: `${BASE_URL}/tasks`
};

export const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
};

export const HTTP_STATUS = {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
};
