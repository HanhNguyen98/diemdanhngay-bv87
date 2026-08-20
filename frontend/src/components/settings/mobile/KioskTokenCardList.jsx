import { memo } from 'react';
import { ADMIN_UI } from '../../../constants/admin';
import KioskTokenCard from './KioskTokenCard';

const KioskTokenCardList = memo(function KioskTokenCardList({
  items,
  busyId,
  copiedKey,
  onCopy,
  onRenameLabel,
  onSetPin,
  onRotate,
  onRevoke,
}) {
  if (!items.length) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-content-muted">
        {ADMIN_UI.fingerprintTokens.empty}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 p-2.5">
      {items.map((row) => (
        <KioskTokenCard
          key={row.id}
          row={row}
          busy={busyId === row.id}
          copiedKey={copiedKey}
          onCopy={onCopy}
          onRenameLabel={onRenameLabel}
          onSetPin={onSetPin}
          onRotate={onRotate}
          onRevoke={onRevoke}
        />
      ))}
    </div>
  );
});

export default KioskTokenCardList;
