const BASE = '/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function resolveErrorMessage(status, bodyMessage) {
  if (bodyMessage) return bodyMessage;
  if (status === 401) return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Không có quyền truy cập.';
  if (status === 429) return 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.';
  return `Lỗi HTTP ${status}`;
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new ApiError(resolveErrorMessage(response.status, err.message), response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}
