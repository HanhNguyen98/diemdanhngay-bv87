import { useState } from 'react';
import { AI_ASSISTANT_UI } from '../../../constants/aiAssistant';
import { todayISO } from '../../../utils/formatters';

export default function DatePickerCard({ onSubmit, loading }) {
  const [date, setDate] = useState(todayISO());

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-semibold text-gray-800">{AI_ASSISTANT_UI.widgets.datePickerTitle}</p>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mt-2 w-full h-9 border border-gray-200 rounded-lg px-2 text-sm"
      />
      <button
        type="button"
        disabled={loading || !date}
        onClick={() => onSubmit({ date })}
        className="mt-3 h-8 px-3 rounded-lg btn-primary text-xs disabled:opacity-60"
      >
        {AI_ASSISTANT_UI.widgets.datePickerSubmit}
      </button>
    </div>
  );
}
