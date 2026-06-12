import { apiRequest } from '../api/http';

export { ApiError } from '../api/http';

export const adminApi = {
  getStats: () => apiRequest('/admin/stats'),

  getDashboard: () => apiRequest('/admin/dashboard'),

  sendReminders: (deptCodes) =>
    apiRequest('/admin/attendance/reminders', {
      method: 'POST',
      body: JSON.stringify({ deptCodes }),
    }),

  getReminderHistory: (from, to) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const q = params.toString();
    return apiRequest(`/admin/attendance/reminder-history${q ? `?${q}` : ''}`);
  },

  blockReport: (deptCode, reason) =>
    apiRequest('/admin/attendance/report-blocks', {
      method: 'POST',
      body: JSON.stringify({ deptCode, reason }),
    }),

  unblockReport: (deptCode) =>
    apiRequest(`/admin/attendance/report-blocks/${deptCode}`, { method: 'DELETE' }),

  getNextDeptCode: () => apiRequest('/admin/departments/next-code'),
  listDepartments: () => apiRequest('/admin/departments'),
  getDepartment: (deptCode) => apiRequest(`/admin/departments/${deptCode}`),
  createDepartment: (body) =>
    apiRequest('/admin/departments', { method: 'POST', body: JSON.stringify(body) }),
  updateDepartment: (deptCode, body) =>
    apiRequest(`/admin/departments/${deptCode}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDepartment: (deptCode) =>
    apiRequest(`/admin/departments/${deptCode}`, { method: 'DELETE' }),

  getNextEmpCode: (deptCode) =>
    apiRequest(`/admin/staff/next-code?deptCode=${deptCode}`),
  listStaff: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.deptCode != null) qs.set('deptCode', String(params.deptCode));
    const q = qs.toString();
    return apiRequest(`/admin/staff${q ? `?${q}` : ''}`);
  },
  getStaff: (empCode) => apiRequest(`/admin/staff/${empCode}`),
  createStaff: (body) =>
    apiRequest('/admin/staff', { method: 'POST', body: JSON.stringify(body) }),
  updateStaff: (empCode, body) =>
    apiRequest(`/admin/staff/${empCode}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteStaff: (empCode) =>
    apiRequest(`/admin/staff/${empCode}`, { method: 'DELETE' }),

  getBranding: () => apiRequest('/admin/settings/branding'),
  updateBranding: (body) =>
    apiRequest('/admin/settings/branding', { method: 'PUT', body: JSON.stringify(body) }),

  listAccounts: () => apiRequest('/admin/accounts'),
  createAccount: (body) =>
    apiRequest('/admin/accounts', { method: 'POST', body: JSON.stringify(body) }),
  updateAccount: (accountId, body) =>
    apiRequest(`/admin/accounts/${accountId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAccount: (accountId) =>
    apiRequest(`/admin/accounts/${accountId}`, { method: 'DELETE' }),
  resetAccountPassword: (accountId, newPassword, confirmPassword) =>
    apiRequest(`/admin/accounts/${accountId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword, confirmPassword }),
    }),
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
};
