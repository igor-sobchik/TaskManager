// src/config.ts

// Helper to parse boolean env vars
const getBool = (key: string, defaultVal: boolean): boolean => {
  const val = import.meta.env[key];
  if (val === 'true') return true;
  if (val === 'false') return false;
  return defaultVal;
};

// Helper to parse array env vars (comma separated)
const getArray = (key: string, defaultVal: string[]): string[] => {
  const val = import.meta.env[key];
  return val ? val.split(',') : defaultVal;
};

export const config = {
  // Use VITE_ prefix for all variables
  useLocalStorage: getBool('VITE_USE_LOCAL_STORAGE', false),
  
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://task-manager-backend.devowl.ovh/api',
  
  timezone: import.meta.env.VITE_TIMEZONE || 'Asia/Tbilisi',
  
  taskTypes: getArray('VITE_TASK_TYPES', ['WORK', 'Home', 'Groceries', 'Trip']),
  
  defaultInputTaskType: import.meta.env.VITE_DEFAULT_TASK_TYPE || 'WORK'
};