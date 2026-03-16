import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

export const getBoard = () => api.get('/board');
export const createTask = (task) => api.post('/tasks', task);
export const moveTask = (taskId, targetColumnId, newOrder) => 
  api.put(`/tasks/${taskId}/move`, { targetColumnId, newOrder });
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);
export const reorderColumns = (columns) => api.put('/columns/reorder', { columns });
// ... more endpoints if needed

export default api;
