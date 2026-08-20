/** Red asterisk for required form labels — shared across modals. */
export default function RequiredMark() {
  return (
    <span className="text-danger-fg ml-0.5" aria-hidden="true">
      *
    </span>
  );
}

export function FormFieldLabel({ children, required = false, className = '' }) {
  return (
    <span className={`text-xs font-medium text-content-muted ${className}`.trim()}>
      {children}
      {required ? <RequiredMark /> : null}
    </span>
  );
}
