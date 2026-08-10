import { Bot, User } from 'lucide-react';
import DownloadCard from './widgets/DownloadCard';
import ReminderConfirmCard from './widgets/ReminderConfirmCard';
import TimeRangePickerCard from './widgets/TimeRangePickerCard';
import DatePickerCard from './widgets/DatePickerCard';
import PendingDeptTable from './widgets/PendingDeptTable';
import { WorkStatusReportTable, AttendanceStatusReportTable } from './widgets/StatusReportTable';

function WidgetRenderer({
  widget,
  messageId,
  widgetIndex,
  loading,
  onConfirmReminders,
  onDismissWidget,
  onExecuteTool,
  onTriggerReminders,
}) {
  switch (widget.type) {
    case 'download_card':
      return <DownloadCard payload={widget.payload} />;
    case 'reminder_confirm':
      return (
        <ReminderConfirmCard
          payload={widget.payload}
          loading={loading}
          onCancel={() => onDismissWidget(messageId, widgetIndex)}
          onConfirm={(deptCodes) =>
            onConfirmReminders(messageId, widgetIndex, widget.payload?.actionId, deptCodes)
          }
        />
      );
    case 'time_range_picker':
      return (
        <TimeRangePickerCard
          loading={loading}
          onSubmit={(params) =>
            onExecuteTool('work_status_report', params, {
              dismissMessageId: messageId,
              dismissWidgetIndex: widgetIndex,
            })
          }
        />
      );
    case 'date_picker':
      return (
        <DatePickerCard
          loading={loading}
          onSubmit={(params) =>
            onExecuteTool('attendance_status_report', params, {
              dismissMessageId: messageId,
              dismissWidgetIndex: widgetIndex,
            })
          }
        />
      );
    case 'status_report_table':
      return <WorkStatusReportTable payload={widget.payload} />;
    case 'attendance_report_table':
      return <AttendanceStatusReportTable payload={widget.payload} />;
    case 'pending_dept_table':
      return (
        <PendingDeptTable
          payload={widget.payload}
          loading={loading}
          onSendReminders={() => onTriggerReminders?.(widget.payload?.date)}
        />
      );
    default:
      return null;
  }
}

export default function ClinicalFlowMessage({
  message,
  loading,
  onConfirmReminders,
  onDismissWidget,
  onExecuteTool,
  onTriggerReminders,
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-700'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`min-w-0 max-w-[92%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block text-left rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-white rounded-br-md'
              : 'bg-blue-50 text-gray-800 rounded-bl-md border border-blue-100/80'
          }`}
        >
          {message.content}
          {message.streaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-blue-400 animate-pulse align-middle rounded-sm" />
          )}
        </div>
        {!isUser &&
          message.widgets?.map((widget, index) => (
            <WidgetRenderer
              key={`${message.id}-widget-${index}`}
              widget={widget}
              messageId={message.id}
              widgetIndex={index}
              loading={loading}
              onConfirmReminders={onConfirmReminders}
              onDismissWidget={onDismissWidget}
              onExecuteTool={onExecuteTool}
              onTriggerReminders={onTriggerReminders}
            />
          ))}
      </div>
    </div>
  );
}
