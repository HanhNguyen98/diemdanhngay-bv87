import { Bot, User } from 'lucide-react';
import StatusPickerCard from './widgets/StatusPickerCard';
import BatchAttendanceConfirmCard from './widgets/BatchAttendanceConfirmCard';

function WidgetRenderer({
  widget,
  messageId,
  widgetIndex,
  loading,
  onConfirmBatch,
  onDismissWidget,
  onExecuteTool,
}) {
  switch (widget.type) {
    case 'status_picker':
      return (
        <StatusPickerCard
          payload={widget.payload}
          loading={loading}
          onSubmit={(params) =>
            onExecuteTool('batch_attendance', params, {
              dismissMessageId: messageId,
              dismissWidgetIndex: widgetIndex,
            })
          }
        />
      );
    case 'batch_attendance_confirm':
      return (
        <BatchAttendanceConfirmCard
          payload={widget.payload}
          loading={loading}
          onCancel={() => onDismissWidget(messageId, widgetIndex)}
          onConfirm={(actionId) => onConfirmBatch(messageId, widgetIndex, actionId)}
        />
      );
    default:
      return null;
  }
}

export default function HeadFlowMessage({
  message,
  loading,
  onConfirmBatch,
  onDismissWidget,
  onExecuteTool,
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
              onConfirmBatch={onConfirmBatch}
              onDismissWidget={onDismissWidget}
              onExecuteTool={onExecuteTool}
            />
          ))}
      </div>
    </div>
  );
}
