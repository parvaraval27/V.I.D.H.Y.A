import { api } from './api';

export const getReminders = (params?: { from?: string; to?: string }) => api.get('/reminders', { params });
export const createReminder = (payload: any) => api.post('/reminders', payload);
export const updateReminder = (id: string, payload: any) => api.put(`/reminders/${id}`, payload);
export const deleteReminder = (id: string) => api.delete(`/reminders/${id}`);

export const getReminderTypes = () => api.get('/reminders/types');
export const createReminderType = (payload: any) => api.post('/reminders/types', payload);
export const updateReminderType = (id: string, payload: any) => api.put(`/reminders/types/${id}`, payload);
export const deleteReminderType = (id: string) => api.delete(`/reminders/types/${id}`);
