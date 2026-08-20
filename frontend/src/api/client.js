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

  getAttendanceStatusTypes: () => apiRequest('/attendance/status-types'),

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

  getAttendancePage: (deptCode, date, options = {}) => {
    const params = new URLSearchParams();
    if (deptCode != null) params.set('deptCode', deptCode);
    if (date) params.set('date', date);
    return apiRequest(`/attendance/page?${params}`, options);
  },

  getScanLogs: (empCode, date, page = 1, pageSize = 20) => {
    const params = new URLSearchParams();
    params.set('empCode', empCode);
    if (date) params.set('date', date);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return apiRequest(`/attendance/scan-logs?${params}`);
  },

  getManualSchedule: (empCode, from, to) => {
    const params = new URLSearchParams();
    params.set('empCode', String(empCode));
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return apiRequest(`/attendance/manual-schedule?${params}`);
  },

  updateAttendance: (empCode, status, note, date) => {
    const params = date ? `?date=${date}` : '';
    return apiRequest(`/attendance${params}`, {
      method: 'PUT',
      body: JSON.stringify({ empCode, status, note }),
    });
  },

  saveMissingPunchExplain: ({ empCode, date, reason, payrollIntent }) =>
    apiRequest('/attendance/missing-punch-explain', {
      method: 'PUT',
      body: JSON.stringify({ empCode, date, reason, payrollIntent }),
    }),

  assignNghiTrucWizard: ({ empCode, fromDate, toDate, reason, payrollIntent, note }) =>
    apiRequest('/attendance/nghi-truc-assign', {
      method: 'PUT',
      body: JSON.stringify({ empCode, fromDate, toDate, reason, payrollIntent, note }),
    }),

  updateAttendanceManualRange: ({ empCode, status, fromDate, toDate, note }) =>
    apiRequest('/attendance/manual-range', {
      method: 'PUT',
      body: JSON.stringify({ empCode, status, fromDate, toDate, note }),
    }),

  previewAttendanceManualRange: ({ empCode, fromDate, toDate, status }) =>
    apiRequest('/attendance/manual-range/preview', {
      method: 'POST',
      body: JSON.stringify({ empCode, fromDate, toDate, status }),
    }),

  requestUnlockDepartment: (date, reason) =>
    apiRequest('/attendance/unlock-requests', {
      method: 'POST',
      body: JSON.stringify({ date, reason }),
    }),

  unlockDepartment: (deptCode, reason, date) =>
    apiRequest('/attendance/unlock', {
      method: 'POST',
      body: JSON.stringify({ deptCode, reason, ...(date ? { date } : {}) }),
    }),

  relockDepartment: (deptCode, date) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    const q = params.toString();
    return apiRequest(`/attendance/unlock/${deptCode}${q ? `?${q}` : ''}`, { method: 'DELETE' });
  },

  submitReport: (deptCode, date) => {
    const params = new URLSearchParams();
    if (deptCode != null) params.set('deptCode', deptCode);
    if (date) params.set('date', date);
    const q = params.toString();
    return apiRequest(`/attendance/report-submit${q ? `?${q}` : ''}`, { method: 'POST' });
  },

  getMissingPunches: (deptCode, date) => {
    const params = new URLSearchParams();
    if (deptCode != null) params.set('deptCode', deptCode);
    if (date) params.set('date', date);
    const q = params.toString();
    return apiRequest(`/attendance/missing-punches${q ? `?${q}` : ''}`);
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

export const headApi = {
  listStaff: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    const q = qs.toString();
    return apiRequest(`/head/staff${q ? `?${q}` : ''}`);
  },
  getStaffStats: () => apiRequest('/head/staff/stats'),
  updateStaffAvatar: (empCode, avatarUrl) =>
    apiRequest(`/head/staff/${empCode}/avatar`, {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl }),
    }),
  listFingerprints: () => apiRequest('/head/fingerprints'),
};
