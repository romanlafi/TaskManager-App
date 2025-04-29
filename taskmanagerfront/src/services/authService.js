import {API_ENDPOINTS, HTTP_METHODS} from "../config/api.js";

export const loginUser = async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: HTTP_METHODS.POST,
        headers: {},
        body: formData
    })

    const data = await response.json();
    return { status: response.status, data: data };
}

export const registerUser = async (username, password) => {
    const response = await fetch(API_ENDPOINTS.USERS, {
        method: HTTP_METHODS.POST,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    return { status: response.status, data };
};