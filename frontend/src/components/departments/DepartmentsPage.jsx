import { lazy, Suspense, useState } from 'react';

import { ADMIN_UI } from '../../constants/admin';

import { useDepartmentPage } from '../../hooks/useDepartmentPage';

import RegistrySearchInput from '../admin/sections/RegistrySearchInput';
import ExcelTaskMenu from '../admin/sections/ExcelTaskMenu';

import RegistryTableShell from '../admin/sections/RegistryTableShell';

import TablePagination from '../admin/sections/TablePagination';

import FlashBanner from '../shared/FlashBanner';
import InlineErrorBanner from '../shared/InlineErrorBanner';

import DepartmentStatGrid from './DepartmentStatGrid';

import DepartmentTable from './DepartmentTable';

import DepartmentViewModal from './DepartmentViewModal';

import DepartmentLocationMapModal from './DepartmentLocationMapModal';



const DepartmentFormModal = lazy(() => import('./DepartmentFormModal'));

const DeleteModal = lazy(() => import('../shared/DeleteModal'));



export default function DepartmentsPage() {

  const [locationMapDept, setLocationMapDept] = useState(null);



  const {

    search,

    setSearch,

    stats,

    loading,

    error,

    paginated,

    filteredCount,

    page,

    totalPages,

    pageSize,

    goToPage,

    staffList,

    formDept,

    setFormDept,

    deleteDept,

    setDeleteDept,

    deleteLoading,

    viewDept,

    setViewDept,

    handleSave,

    handleDelete,

    importing,

    handleTemplateDownload,

    handleImportFile,

    handleExport,

    flash,

    clearFlash,

  } = useDepartmentPage();



  return (

    <>

      <div className="flex flex-col h-full min-h-0 gap-2">
        {flash && <FlashBanner flash={flash} onClose={clearFlash} />}

        <InlineErrorBanner message={error} />



        <div className="shrink-0">
          <DepartmentStatGrid stats={stats} />
        </div>

        <RegistryTableShell

          actionLabel={ADMIN_UI.departments.newButton}

          onAction={() => setFormDept({})}

          searchControl={

            <RegistrySearchInput

              value={search}

              onChange={setSearch}

              placeholder={ADMIN_UI.searchPlaceholderDepartments}

            />

          }

          excelControl={

            <ExcelTaskMenu

              onTemplate={handleTemplateDownload}

              onImport={handleImportFile}

              onExport={handleExport}

              importing={importing}

              disabled={loading}

            />

          }

          loading={loading}

          loadingLabel={ADMIN_UI.loading}

          footer={

            <TablePagination

              page={page}

              totalPages={totalPages}

              totalItems={filteredCount}

              pageSize={pageSize}

              onPageChange={goToPage}

              unitLabel="Đơn vị"

            />

          }

        >

          <DepartmentTable

            items={paginated}

            onView={setViewDept}

            onEdit={setFormDept}

            onDelete={setDeleteDept}

            onViewLocation={setLocationMapDept}

          />

        </RegistryTableShell>



        <DepartmentViewModal dept={viewDept} onClose={() => setViewDept(null)} />

        <DepartmentLocationMapModal

          dept={locationMapDept}

          onClose={() => setLocationMapDept(null)}

        />



        <Suspense fallback={null}>

          {formDept && (

            <DepartmentFormModal

              initial={formDept.deptCode ? formDept : null}

              staffList={staffList}

              onSave={handleSave}

              onClose={() => setFormDept(null)}

            />

          )}

          {deleteDept && (

            <DeleteModal

              title={ADMIN_UI.departments.deleteTitle}

              message={ADMIN_UI.departments.deleteMessage(deleteDept.deptName)}

              onConfirm={handleDelete}

              onClose={() => setDeleteDept(null)}

              loading={deleteLoading}

            />

          )}

        </Suspense>

      </div>

    </>

  );

}

