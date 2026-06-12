import { useState } from 'react';
import { AI_ASSISTANT_UI } from '../../../constants/aiAssistant';
import { todayISO } from '../../../utils/formatters';

export default function TimeRangePickerCard({ onSubmit, loading }) {
  const today = todayISO();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-semibold text-gray-800">{AI_ASSISTANT_UI.widgets.timeRangeTitle}</p>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block text-xs text-content-muted">
          {AI_ASSISTANT_UI.widgets.timeRangeFrom}
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="mt-1 w-full h-9 border border-gray-200 rounded-lg px-2 text-sm"
          />
        </label>
        <label className="block text-xs text-content-muted">
          {AI_ASSISTANT_UI.widgets.timeRangeTo}
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="mt-1 w-full h-9 border border-gray-200 rounded-lg px-2 text-sm"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={loading || !fromDate || !toDate}
        onClick={() => onSubmit({ fromDate, toDate })}
        className="mt-3 h-8 px-3 rounded-lg btn-primary text-xs disabled:opacity-60"
      >
        {AI_ASSISTANT_UI.widgets.timeRangeSubmit}
      </button>
    </div>
  );
}
