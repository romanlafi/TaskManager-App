export const MESSAGES = {
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  TASK_DELETED: 'Task deleted successfully',
  LOGIN_SUCCESS: 'Login successful!',
  LOGIN_ERROR: 'Invalid credentials',

  SESSION_EXPIRED_ERROR: 'Session expired',
  SESSION_ENDED: 'Session closed',
  LOGOUT_ERROR: 'Signed out locally, but the server could not revoke the session. Please try again when connected.',

  REGISTER_SUCCESS: 'Registration complete. You can now log in.',
  REGISTER_CONFLICT: 'Username already exists',
  USER_NOT_FOUND: 'User not found.',

  SERVER_ERROR: 'Server connection error. Please try again.',
  UNEXPECTED_ERROR: 'Unexpected error. Please try again.',
} as const;
