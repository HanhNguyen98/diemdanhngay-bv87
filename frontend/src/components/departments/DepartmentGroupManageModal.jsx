import { lazy, Suspense, useCallback, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { ADMIN_UI } from '../../constants/admin';
import { useDepartmentGroups } from '../../hooks/useDepartmentGroups';
import { useFlashMessage } from '../../hooks/useFlashMessage';
import FlashBanner from '../shared/FlashBanner';
import InlineErrorBanner from '../shared/InlineErrorBanner';
import RefreshOverlay from '../shared/RefreshOverlay';
import { ActionBtn } from '../admin/sections/ActionButtons';
import DepartmentGroupCardList from './mobile/DepartmentGroupCardList';

const DepartmentGroupFormModal = lazy(() => import('./DepartmentGroupFormModal'));
const DeleteModal = lazy(() => import('../shared/DeleteModal'));

const { departmentGroups: g } = ADMIN_UI;

function AddGroupButton({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 btn-primary rounded-lg text-sm font-semibold leading-[2rem] shadow-sm ${className}`}
    >
      <Plus className="w-3.5 h-3.5 shrink-0" />
      {g.newButton}
    </button>
  );
}

function GroupTable({ items, onEdit, onDelete }) {
  const { catalog: catalogUi } = ADMIN_UI;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="table-header-row">
          <th className="table-th-left">{g.columns.code}</th>
          <th className="table-th-left">{g.columns.name}</th>
          <th className="table-th-center">{g.columns.sortOrder}</th>
          <th className="table-th-center">{g.columns.deptCount}</th>
          <th className="table-th-right">{g.columns.actions}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((group) => {
          const deleteBlocked = (group.deptCount ?? 0) > 0;
          return (
          <tr key={group.groupCode} className="border-b border-gray-100 hover:bg-surface-page/80">
            <td className="py-3 px-2 text-primary font-medium tabular-nums">
              {group.groupCodeFormatted}
            </td>
            <td className="py-3 px-2 font-medium text-gray-800">{group.groupName}</td>
            <td className="py-3 px-2 text-center tabular-nums">{group.sortOrder}</td>
            <td className="py-3 px-2 text-center tabular-nums">{group.deptCount}</td>
            <td className="py-3 px-2">
              <div className="flex items-center gap-1 justify-end">
                <ActionBtn
                  icon={Pencil}
                  onClick={() => onEdit(group)}
                  colorClass="text-gray-600 hover:bg-neutral"
                  label="Sửa"
                />
                <ActionBtn
                  icon={Trash2}
                  onClick={() => onDelete(group)}
                  disabled={deleteBlocked}
                  title={
                    deleteBlocked
                      ? catalogUi.deleteBlockedGroup(group.deptCount)
                      : 'Xóa'
                  }
                  colorClass="text-danger-fg hover:bg-danger"
                  label="Xóa"
                />
              </div>
            </td>
          </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function DepartmentGroupManageModal({ onClose, onGroupsChanged }) {
  const { items, initialLoading, refreshing, error, create, update, remove } = useDepartmentGroups();
  const { flash, showSuccess, showError, clearFlash } = useFlashMessage();
  const [formGroup, setFormGroup] = useState(null);
  const [deleteGroup, setDeleteGroup] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const notifyChanged = useCallback(() => {
    onGroupsChanged?.();
  }, [onGroupsChanged]);

  const handleSave = useCallback(
    async (payload, editCode) => {
      if (editCode != null) {
        await update(editCode, payload);
        showSuccess(ADMIN_UI.flash.groupUpdateSuccess);
      } else {
        await create(payload);
        showSuccess(ADMIN_UI.flash.groupCreateSuccess);
      }
      notifyChanged();
    },
    [create, update, showSuccess, notifyChanged],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteGroup) return;
    const name = deleteGroup.groupName;
    setDeleteLoading(true);
    try {
      await remove(deleteGroup.groupCode);
      setDeleteGroup(null);
      showSuccess(ADMIN_UI.flash.groupDeleteSuccess(name));
      notifyChanged();
    } catch (err) {
      showError(err.message || ADMIN_UI.flash.groupDeleteFail);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteGroup, remove, showSuccess, showError, notifyChanged]);

  const childOpen = Boolean(formGroup || deleteGroup);

  const listBody =
    items.length === 0 ? (
      <p className="text-center py-10 text-content-muted">{ADMIN_UI.empty}</p>
    ) : (
      <>
        <div className="lg:hidden">
          <DepartmentGroupCardList
            items={items}
            onEdit={setFormGroup}
            onDelete={setDeleteGroup}
          />
        </div>
        <div className="hidden lg:block">
          <GroupTable items={items} onEdit={setFormGroup} onDelete={setDeleteGroup} />
        </div>
      </>
    );

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
        onClick={childOpen ? undefined : onClose}
      >
        <div
          className="bg-surface-white shadow-panel w-full flex flex-col animate-fade-in rounded-2xl max-w-2xl max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="department-group-manage-title"
        >
          <div className="shrink-0 sticky top-0 z-10 bg-surface-white border-b border-line rounded-t-2xl">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 id="department-group-manage-title" className="text-base font-bold text-navy">
                {g.manageTitle}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-content-muted hover:bg-neutral transition-colors"
                aria-label={ADMIN_UI.form.cancel}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 py-3 flex flex-col gap-3">
            {flash && <FlashBanner flash={flash} onClose={clearFlash} />}
            <InlineErrorBanner message={error} />

            <AddGroupButton
              onClick={() => setFormGroup({})}
              className="lg:hidden w-full h-10" 
            />
            <div className="hidden lg:flex justify-end">
              <AddGroupButton onClick={() => setFormGroup({})} className="h-8 px-3" />
            </div>

            {initialLoading ? (
              <p className="text-center py-10 text-content-muted animate-pulse">{ADMIN_UI.loading}</p>
            ) : (
              <div className="relative">
                {refreshing && <RefreshOverlay />}
                {listBody}
              </div>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        {formGroup && (
          <DepartmentGroupFormModal
            initial={formGroup.groupCode ? formGroup : null}
            onSave={handleSave}
            onClose={() => setFormGroup(null)}
          />
        )}
        {deleteGroup && (
          <DeleteModal
            title={g.deleteTitle}
            message={g.deleteMessage(deleteGroup.groupName)}
            onConfirm={handleDelete}
            onClose={() => setDeleteGroup(null)}
            loading={deleteLoading}
          />
        )}
      </Suspense>
    </>
  );
}
