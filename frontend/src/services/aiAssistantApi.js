import { ApiError } from '../api/http';

const BASE = '/api';

function parseSseBlock(block) {
  const lines = block.split('\n');
  let event = 'message';
  const dataLines = [];
  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (dataLines.length === 0) return null;
  try {
    return { event, data: JSON.parse(dataLines.join('\n')) };
  } catch {
    return { event, data: dataLines.join('\n') };
  }
}

/**
 * POST + SSE stream (tránh timeout Ngrok nhờ token streaming).
 * @param {{ message?: string, quickAction?: string }} payload
 * @param {{ onEvent: (event: string, data: unknown) => void, signal?: AbortSignal }} handlers
 */
export async function streamAiChat(payload, { onEvent, signal }) {
  const response = await fetch(`${BASE}/admin/ai/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new ApiError(err.message || `Lỗi HTTP ${response.status}`, response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiError('Trình duyệt không hỗ trợ streaming', 0);
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      const parsed = parseSseBlock(part.trim());
      if (parsed) {
        onEvent(parsed.event, parsed.data);
      }
    }
  }

  if (buffer.trim()) {
    const parsed = parseSseBlock(buffer.trim());
    if (parsed) {
      onEvent(parsed.event, parsed.data);
    }
  }
}

export function executeAiTool(tool, params = {}) {
  return fetch(`${BASE}/admin/ai/tools/execute`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, params }),
  }).then(async (response) => {
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new ApiError(err.message || `Lỗi HTTP ${response.status}`, response.status);
    }
    return response.json();
  });
}

export function confirmAiReminders(actionId, deptCodes) {
  return fetch(`${BASE}/admin/ai/tools/confirm-reminders`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionId, deptCodes }),
  }).then(async (response) => {
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new ApiError(err.message || `Lỗi HTTP ${response.status}`, response.status);
    }
    return response.json();
  });
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

const QUICK_ACTION_FALLBACKS = {
  batch_reminders: () => executeAiTool('batch_reminders', {}),
  work_status_report: () =>
    executeAiTool('work_status_report', {
      fromDate: todayIsoDate(),
      toDate: todayIsoDate(),
    }),
  attendance_status_report: () =>
    executeAiTool('attendance_status_report', {
      date: todayIsoDate(),
    }),
};

/**
 * Fallback khi SSE đứt (Cloudflare timeout, mạng yếu).
 */
export function executeAiToolFallback(quickAction) {
  const fallback = QUICK_ACTION_FALLBACKS[quickAction];
  if (!fallback) return null;
  return fallback();
}
