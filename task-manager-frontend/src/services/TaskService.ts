// src/services/TaskService.ts
import { config } from '../config';

export interface Task {
  _id?: string;
  title: string;
  dueDate: string;
  dueTime?: string;
  description?: string;
  completed?: boolean;
  cancelled?: boolean;
  link?: string;
  category?: string;
  taskType?: string;
  completeDate?: string | null;
  customFields: Array<{ key: string; type: string; value: any }>;
}

const TaskService = {
  async request(endpoint: string, options: RequestInit = {}) {
    if (config.useLocalStorage) return null;

    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${config.apiBaseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('authToken');
      window.dispatchEvent(new Event('auth-changed'));
      window.location.hash = '#/login'; // Simple redirect
      throw new Error('Unauthorized');
    }

    return res;
  },

  async login(password: string) {
    if (config.useLocalStorage) {
      await new Promise(r => setTimeout(r, 500));
      if (password === 'admin') return { token: 'mock-token-12345' };
      throw new Error('Incorrect password');
    } else {
      const res = await fetch(`${config.apiBaseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res.ok) throw new Error('Login failed');
      return await res.json();
    }
  },

  async getAll(): Promise<Task[]> {
    if (config.useLocalStorage) {
      return JSON.parse(localStorage.getItem('tasks') || '[]');
    } else {
      const typesParam = config.taskTypes.join(',');
      const res = await this.request(`/tasks?types=${encodeURIComponent(typesParam)}`);

      // @ts-ignore
      if (!res || !res.ok) return [];
      return await res.json();
    }
  },

  async getById(id: string): Promise<Task | null> {
    if (config.useLocalStorage) {
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      return tasks.find((t: Task) => t._id === id) || null;
    } else {
      const res = await this.request(`/tasks/${id}`);

      // @ts-ignore
      if (!res || !res.ok) return null;
      return await res.json();
    }
  },

  async create(task: Task) {
    if (config.useLocalStorage) {
      task._id = Date.now().toString();
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      tasks.push(task);
      localStorage.setItem('tasks', JSON.stringify(tasks));
      return task;
    } else {
      const res = await this.request('/tasks', {
        method: 'POST',
        body: JSON.stringify(task)
      });
      // @ts-ignore
      return await res.json();
    }
  },

  async update(id: string, task: Task) {
    if (config.useLocalStorage) {
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const idx = tasks.findIndex((t: Task) => t._id === id);
      if (idx !== -1) {
        tasks[idx] = { ...tasks[idx], ...task };
        localStorage.setItem('tasks', JSON.stringify(tasks));
      }
      return tasks[idx];
    } else {
      const res = await this.request(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(task)
      });
      // @ts-ignore
      return await res.json();
    }
  },

  async delete(id: string) {
    if (config.useLocalStorage) {
      let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      tasks = tasks.filter((t: Task) => t._id !== id);
      localStorage.setItem('tasks', JSON.stringify(tasks));
    } else {
      await this.request(`/tasks/${id}`, { method: 'DELETE' });
    }
  }
};

export default TaskService;