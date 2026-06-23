import { memo } from 'react';
import { ADMIN_UI } from '../../../constants/admin';

/** Desktop registry table — empty state row below sticky header. */
const RegistryTableEmptyRow = memo(function RegistryTableEmptyRow({
  colSpan,
  message = ADMIN_UI.empty,
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center text-content-muted text-sm">
        {message}
      </td>
    </tr>
  );
});

export default RegistryTableEmptyRow;
