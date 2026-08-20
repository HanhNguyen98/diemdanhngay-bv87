import { apiRequest } from '../api/http';

export { ApiError } from '../api/http';

export const adminApi = {
  getStats: () => apiRequest('/admin/stats'),

  getDashboard: (options = {}) => apiRequest('/admin/dashboard', options),

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

  getAttendanceAuditLogs: ({ from, to, deptCode, username, page = 1, pageSize = 20 } = {}) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (deptCode != null) params.set('deptCode', String(deptCode));
    if (username) params.set('username', username);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return apiRequest(`/admin/attendance/audit-logs?${params.toString()}`);
  },

  listUnlockRequests: (status) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const q = params.toString();
    return apiRequest(`/admin/attendance/unlock-requests${q ? `?${q}` : ''}`);
  },

  getUnlockRequestPendingCount: () =>
    apiRequest('/admin/attendance/unlock-requests/pending-count'),

  approveUnlockRequest: (id) =>
    apiRequest(`/admin/attendance/unlock-requests/${id}/approve`, { method: 'POST' }),

  rejectUnlockRequest: (id, note) =>
    apiRequest(`/admin/attendance/unlock-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ note: note || '' }),
    }),

  blockReport: (deptCode, reason) =>
    apiRequest('/admin/attendance/report-blocks', {
      method: 'POST',
      body: JSON.stringify({ deptCode, reason }),
    }),

  unblockReport: (deptCode) =>
    apiRequest(`/admin/attendance/report-blocks/${deptCode}`, { method: 'DELETE' }),

  toggleDeptLock: (deptCode) =>
    apiRequest(`/admin/attendance/toggle-lock/${deptCode}`, { method: 'POST' }),

  fillAttendanceTimes: (body) =>
    apiRequest('/admin/attendance/times', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  approvePayrollFill: (body) =>
    apiRequest('/admin/attendance/payroll-fill/approve', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  clearAttendance: (body) =>
    apiRequest('/admin/attendance/clear', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getNextDeptCode: () => apiRequest('/admin/departments/next-code'),
  listDepartments: (groupCode, options = {}) => {
    const q = groupCode != null ? `?groupCode=${groupCode}` : '';
    return apiRequest(`/admin/departments${q}`, options);
  },
  getDepartment: (deptCode) => apiRequest(`/admin/departments/${deptCode}`),
  createDepartment: (body) =>
    apiRequest('/admin/departments', { method: 'POST', body: JSON.stringify(body) }),
  updateDepartment: (deptCode, body) =>
    apiRequest(`/admin/departments/${deptCode}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDepartment: (deptCode) =>
    apiRequest(`/admin/departments/${deptCode}`, { method: 'DELETE' }),

  getNextGroupCode: () => apiRequest('/admin/department-groups/next-code'),
  listDepartmentGroups: () => apiRequest('/admin/department-groups'),
  createDepartmentGroup: (body) =>
    apiRequest('/admin/department-groups', { method: 'POST', body: JSON.stringify(body) }),
  updateDepartmentGroup: (groupCode, body) =>
    apiRequest(`/admin/department-groups/${groupCode}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteDepartmentGroup: (groupCode) =>
    apiRequest(`/admin/department-groups/${groupCode}`, { method: 'DELETE' }),

  getNextEmpCode: (deptCode) =>
    apiRequest(`/admin/staff/next-code?deptCode=${deptCode}`),
  listStaff: (params = {}) => {
    const { signal, ...query } = params;
    const qs = new URLSearchParams();
    if (query.search) qs.set('search', query.search);
    if (query.deptCode != null) qs.set('deptCode', String(query.deptCode));
    if (query.page != null) qs.set('page', String(query.page));
    if (query.pageSize != null) qs.set('pageSize', String(query.pageSize));
    const q = qs.toString();
    return apiRequest(`/admin/staff${q ? `?${q}` : ''}`, { signal });
  },
  getStaff: (empCode) => apiRequest(`/admin/staff/${empCode}`),
  getStaffDepartmentHistory: (empCode) =>
    apiRequest(`/admin/staff/${empCode}/department-history`),
  createStaff: (body) =>
    apiRequest('/admin/staff', { method: 'POST', body: JSON.stringify(body) }),
  updateStaff: (empCode, body) =>
    apiRequest(`/admin/staff/${empCode}`, { method: 'PUT', body: JSON.stringify(body) }),
  transferStaff: (empCode, body) =>
    apiRequest(`/admin/staff/${empCode}/transfer`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteStaff: (empCode) =>
    apiRequest(`/admin/staff/${empCode}`, { method: 'DELETE' }),

  listAttendanceStatusTypes: () => apiRequest('/admin/attendance-status-types'),
  getAttendanceStatusType: (id) => apiRequest(`/admin/attendance-status-types/${id}`),
  createAttendanceStatusType: (body) =>
    apiRequest('/admin/attendance-status-types', { method: 'POST', body: JSON.stringify(body) }),
  updateAttendanceStatusType: (id, body) =>
    apiRequest(`/admin/attendance-status-types/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAttendanceStatusType: (id) =>
    apiRequest(`/admin/attendance-status-types/${id}`, { method: 'DELETE' }),

  getNextStaffRankCode: () => apiRequest('/admin/staff-ranks/next-code'),
  listStaffRanks: () => apiRequest('/admin/staff-ranks'),
  createStaffRank: (body) =>
    apiRequest('/admin/staff-ranks', { method: 'POST', body: JSON.stringify(body) }),
  updateStaffRank: (rankCode, body) =>
    apiRequest(`/admin/staff-ranks/${rankCode}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteStaffRank: (rankCode) =>
    apiRequest(`/admin/staff-ranks/${rankCode}`, { method: 'DELETE' }),

  getNextStaffPositionCode: () => apiRequest('/admin/staff-positions/next-code'),
  listStaffPositions: () => apiRequest('/admin/staff-positions'),
  createStaffPosition: (body) =>
    apiRequest('/admin/staff-positions', { method: 'POST', body: JSON.stringify(body) }),
  updateStaffPosition: (positionCode, body) =>
    apiRequest(`/admin/staff-positions/${positionCode}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteStaffPosition: (positionCode) =>
    apiRequest(`/admin/staff-positions/${positionCode}`, { method: 'DELETE' }),

  getBranding: () => apiRequest('/admin/settings/branding'),
  updateBranding: (body) =>
    apiRequest('/admin/settings/branding', { method: 'PUT', body: JSON.stringify(body) }),

  getAccountStats: () => apiRequest('/admin/accounts/stats'),

  listAccounts: (params = {}) => {
    const { signal, ...query } = params;
    const qs = new URLSearchParams();
    if (query.search) qs.set('search', query.search);
    if (query.role) qs.set('role', query.role);
    if (query.status) qs.set('status', query.status);
    if (query.page != null) qs.set('page', String(query.page));
    if (query.pageSize != null) qs.set('pageSize', String(query.pageSize));
    const q = qs.toString();
    return apiRequest(`/admin/accounts${q ? `?${q}` : ''}`, { signal });
  },
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

  listFingerprints: (deptCode) => {
    const qs = deptCode != null ? `?deptCode=${deptCode}` : '';
    return apiRequest(`/admin/fingerprints${qs}`);
  },

  listKioskTokens: () => apiRequest('/admin/fingerprint/kiosk-tokens'),
  createKioskToken: (body) =>
    apiRequest('/admin/fingerprint/kiosk-tokens', { method: 'POST', body: JSON.stringify(body) }),
  setKioskEnrollPin: (id, body) =>
    apiRequest(`/admin/fingerprint/kiosk-tokens/${id}/enroll-pin`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateKioskTokenLabel: (id, body) =>
    apiRequest(`/admin/fingerprint/kiosk-tokens/${id}/label`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  revokeKioskToken: (id) =>
    apiRequest(`/admin/fingerprint/kiosk-tokens/${id}/revoke`, { method: 'POST' }),
  rotateKioskToken: (id) =>
    apiRequest(`/admin/fingerprint/kiosk-tokens/${id}/rotate`, { method: 'POST' }),
};

export { headApi } from '../api/client';
