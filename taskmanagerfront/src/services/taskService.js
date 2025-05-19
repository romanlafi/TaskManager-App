import {API_ENDPOINTS, HTTP_METHODS} from "../config/api.js";

const getToken = () => localStorage.getItem("access_token");

export const fetchTasks = async (skip, limit, search, orderBy, status, beforeDeadline) => {
    const token = getToken();

    const params = new URLSearchParams({
        skip,
        limit,
        search,
        order_by: orderBy,
    });
    if (status) params.append('status', status);
    if (beforeDeadline) params.append('before_deadline', beforeDeadline);

    const url = `${API_ENDPOINTS.TASKS}?${params.toString()}`;

    const response = await fetch(url, {
        method: HTTP_METHODS.GET,
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    });

    const data = await response.json();
    return { status: response.status, data };
};

export const createTask = async (title, description, deadline) => {
    const token = getToken();

    const response = await fetch(API_ENDPOINTS.TASKS, {
        method: HTTP_METHODS.POST,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, deadline })
    });

    return await response.json();
};

export const deleteTask = async (taskId) => {
    const token = getToken();

    await fetch(`${API_ENDPOINTS.TASKS}${taskId}`, {
        method: HTTP_METHODS.DELETE,
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

export const updateTask = async (taskId, title, description, status, deadline) => {
    const token = getToken();

    const response = await fetch(`${API_ENDPOINTS.TASKS}${taskId}`, {
        method: HTTP_METHODS.PUT,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, status, deadline })
    });

    return await response.json();
};