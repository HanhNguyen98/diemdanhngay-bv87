import { memo } from 'react';

const STACK_COLORS = [
  'bg-primary text-white',
  'bg-success-fg text-white',
  'bg-navy text-white',
];

const AvatarStack = memo(function AvatarStack({ count = 0, max = 3 }) {
  if (!count) return null;

  const visible = Math.min(count, max);
  const extra = count > max ? count - max : 0;

  return (
    <div className="flex items-center -space-x-2">
      {Array.from({ length: visible }, (_, i) => (
        <div
          key={i}
          className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-4xs font-bold shrink-0 ${STACK_COLORS[i % STACK_COLORS.length]}`}
        >
          {i + 1}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full border-2 border-white bg-neutral text-neutral-fg flex items-center justify-center text-4xs font-bold shrink-0">
          +{extra}
        </div>
      )}
    </div>
  );
});

export default AvatarStack;
