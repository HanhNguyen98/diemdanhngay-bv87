import { apiRequest } from './http';

export { ApiError } from './http';

export const api = {
  login: (username, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => apiRequest('/auth/logout', { method: 'POST' }),

  me: () => apiRequest('/auth/me'),

  changePassword: (currentPassword, newPassword, confirmPassword) =>
    apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    }),

  getDepartments: () => apiRequest('/departments'),

  getSessionStatus: () => apiRequest('/session/status'),

  getSummary: (deptCode, date) => {
    const params = new URLSearchParams();
    if (deptCode != null) params.set('deptCode', deptCode);
    if (date) params.set('date', date);
    return apiRequest(`/attendance/summary?${params}`);
  },

  getAllSummaries: (date) => {
    const params = date ? `?date=${date}` : '';
    return apiRequest(`/attendance/summaries${params}`);
  },

  getStaffList: (deptCode, date) => {
    const params = new URLSearchParams();
    if (deptCode != null) params.set('deptCode', deptCode);
    if (date) params.set('date', date);
    return apiRequest(`/attendance/staff?${params}`);
  },

  getAttendancePage: (deptCode, date) => {
    const params = new URLSearchParams();
    if (deptCode != null) params.set('deptCode', deptCode);
    if (date) params.set('date', date);
    return apiRequest(`/attendance/page?${params}`);
  },

  updateAttendance: (empCode, status, note, date) => {
    const params = date ? `?date=${date}` : '';
    return apiRequest(`/attendance${params}`, {
      method: 'PUT',
      body: JSON.stringify({ empCode, status, note }),
    });
  },

  unlockDepartment: (deptCode, reason) =>
    apiRequest('/attendance/unlock', {
      method: 'POST',
      body: JSON.stringify({ deptCode, reason }),
    }),

  submitReport: (deptCode, date) => {
    const params = new URLSearchParams();
    if (deptCode != null) params.set('deptCode', deptCode);
    if (date) params.set('date', date);
    const q = params.toString();
    return apiRequest(`/attendance/report-submit${q ? `?${q}` : ''}`, { method: 'POST' });
  },

  getNotifications: () => apiRequest('/notifications'),

  getUnreadNotificationCount: () => apiRequest('/notifications/unread-count'),

  markNotificationRead: (id) =>
    apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    apiRequest('/notifications/read-all', { method: 'PATCH' }),

  getStatistics: (deptCode, from, to, search) => {
    const params = new URLSearchParams({ from, to });
    if (deptCode != null) params.set('deptCode', deptCode);
    if (search?.trim()) params.set('search', search.trim());
    return apiRequest(`/attendance/statistics?${params}`);
  },

  getStatisticsHistory: (deptCode, from, to, search, page, pageSize) => {
    const params = new URLSearchParams({ from, to, page: String(page), pageSize: String(pageSize) });
    if (deptCode != null) params.set('deptCode', deptCode);
    if (search?.trim()) params.set('search', search.trim());
    return apiRequest(`/attendance/statistics/history?${params}`);
  },

  exportStatisticsHistory: (deptCode, from, to, search) => {
    const params = new URLSearchParams({ from, to });
    if (deptCode != null) params.set('deptCode', deptCode);
    if (search?.trim()) params.set('search', search.trim());
    return apiRequest(`/attendance/statistics/history/export?${params}`);
  },
};
