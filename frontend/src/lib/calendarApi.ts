import { api } from './api';

export const getReminders = (params?: { from?: string; to?: string }) => api.get('/reminders', { params });
export const createReminder = (payload: any) => api.post('/reminders', payload);
export const updateReminder = (id: string, payload: any) => api.put(`/reminders/${id}`, payload);
// Delete reminder - pass occurrenceDate to delete single occurrence, or deleteAll=true to delete entire series
export const deleteReminder = (id: string, params?: { occurrenceDate?: string; deleteAll?: boolean }) => 
  api.delete(`/reminders/${id}`, { params });

export const getReminderTypes = () => api.get('/reminders/types');
export const createReminderType = (payload: any) => api.post('/reminders/types', payload);
export const updateReminderType = (id: string, payload: any) => api.put(`/reminders/types/${id}`, payload);
export const deleteReminderType = (id: string) => api.delete(`/reminders/types/${id}`);

// Fetch Codeforces contest list (client-side). Returns the raw Codeforces API response.
export const getCodeforcesContests = () => fetch('https://codeforces.com/api/contest.list').then(res => res.json());

// Fetch LeetCode upcoming contests from alfa-leetcode-api (public, no auth required).
// Response shape: { count, contests: [ { title, titleSlug, startTime (unix sec), duration (sec), ... } ] }
export const getLeetCodeContests = () => fetch('https://alfa-leetcode-api.onrender.com/contests/upcoming').then(res => res.json());

// Fetch AtCoder contests via backend proxy (to avoid CORS issues with kontests.net)
// Response shape: [ { name, url, start_time (ISO), end_time (ISO), duration (seconds string), site, in_24_hours, status } ]
export const getAtCoderContests = async () => {
  try {
    // First try via our backend proxy
    const res = await api.get('/contests/atcoder');
    return res.data;
  } catch (e) {
    console.warn('Backend AtCoder proxy failed, trying direct kontests.net...');
    // Fallback: try direct kontests.net (may have CORS issues in browser)
    try {
      const directRes = await fetch('https://kontests.net/api/v1/at_coder');
      if (!directRes.ok) throw new Error(`HTTP ${directRes.status}`);
      return await directRes.json();
    } catch (e2) {
      console.error('AtCoder contests fetch failed:', e2);
      return [];
    }
  }
};
