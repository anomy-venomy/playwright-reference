import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useDebounce } from '../hooks/useDebounce';
import { employeeService } from '../services/employeeService';
import { metaService } from '../services/metaService';
import { ApiError } from '../services/api';
import { Spinner } from '../components/Spinner';
import { EmptyState, ErrorState } from '../components/StateMessages';
import { StatusBadge } from '../components/StatusBadge';
import { Pagination } from '../components/Pagination';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Avatar } from '../components/Avatar';
import { formatDate } from '../utils/format';
import type { Department, Employee, PaginationMeta, Role } from '../types';

const COLUMNS: { key: string; label: string; sortable: boolean }[] = [
  { key: 'employeeCode', label: 'Employee ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'joiningDate', label: 'Joining Date', sortable: true },
];
const FILTER_KEYS = ['search', 'department', 'role', 'status'];
const PAGE_SIZES = [5, 10, 25, 50];

export function EmployeesPage() {
  useDocumentTitle('Employees');
  const { isAdmin } = useAuth();
  const toast = useToast();

  // All list state lives in the URL so filters survive refresh and can be deep-linked.
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const pageSize = Number(params.get('pageSize')) || 10;
  const department = params.get('department') ?? '';
  const role = params.get('role') ?? '';
  const status = params.get('status') ?? '';
  const sortBy = params.get('sortBy') ?? 'employeeCode';
  const sortOrder = params.get('sortOrder') === 'desc' ? 'desc' : 'asc';
  const search = params.get('search') ?? '';

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [toDelete, setToDelete] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const updateParams = useCallback(
    (changes: Record<string, string | number | null>, resetPage = true) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(changes)) {
            if (v === null || v === '') next.delete(k);
            else next.set(k, String(v));
          }
          if (resetPage) next.delete('page');
          return next;
        },
        { replace: false },
      );
    },
    [setParams],
  );

  // Push the debounced search into the URL.
  useEffect(() => {
    if (debouncedSearch.trim() !== search) updateParams({ search: debouncedSearch.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Keep the input in sync if the URL changes (back button, reset).
  useEffect(() => setSearchInput(search), [search]);

  useEffect(() => {
    metaService.departments().then(setDepartments).catch(() => undefined);
  }, []);

  useEffect(() => {
    metaService.roles(department || undefined).then(setRoles).catch(() => undefined);
  }, [department]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    employeeService
      .list({ page, pageSize, search, department, role, status, sortBy, sortOrder }, controller.signal)
      .then((res) => {
        setEmployees(res.data);
        setMeta(res.meta);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof ApiError && err.status === 400
            ? err.message
            : 'Unable to load employees. Please try again.',
        );
        setLoading(false);
      });
    return () => controller.abort();
  }, [page, pageSize, search, department, role, status, sortBy, sortOrder, reloadKey]);

  const hasFilters = useMemo(() => FILTER_KEYS.some((k) => params.get(k)), [params]);

  function resetFilters() {
    setSearchInput('');
    setParams(new URLSearchParams());
  }

  function toggleSort(key: string) {
    const order = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
    updateParams({ sortBy: key, sortOrder: order });
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await employeeService.remove(toDelete.id);
      toast.success('Employee deleted successfully');
      // If we just removed the last row on this page, step back one page.
      if (employees.length === 1 && page > 1) updateParams({ page: page - 1 }, false);
      else setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(`Failed to delete employee. ${err instanceof ApiError ? err.message : ''}`.trim());
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  const from = meta && meta.total > 0 ? (meta.page - 1) * meta.pageSize + 1 : 0;
  const to = meta ? Math.min(meta.page * meta.pageSize, meta.total) : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p className="muted">Manage your organisation&apos;s employees.</p>
        </div>
        {isAdmin && (
          <Link to="/employees/create" className="btn btn-primary">
            Add Employee
          </Link>
        )}
      </div>

      <section className="card">
        <form className="filters" role="search" aria-label="Filter employees" onSubmit={(e) => e.preventDefault()}>
          <div className="field filter-search">
            <label htmlFor="search">Search</label>
            <input
              id="search"
              type="search"
              placeholder="Search by name, email or employee ID"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="filter-department">Department</label>
            <select
              id="filter-department"
              value={department}
              onChange={(e) => updateParams({ department: e.target.value, role: null })}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-role">Role</label>
            <select id="filter-role" value={role} onChange={(e) => updateParams({ role: e.target.value })}>
              <option value="">All roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-status">Status</label>
            <select id="filter-status" value={status} onChange={(e) => updateParams({ status: e.target.value })}>
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <button type="button" className="btn btn-secondary" onClick={resetFilters} disabled={!hasFilters}>
            Reset Filters
          </button>
        </form>

        {loading && <Spinner label="Loading employees..." />}
        {!loading && error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}
        {!loading && !error && employees.length === 0 && (
          <EmptyState
            title="No employees found"
            description={hasFilters ? 'Try adjusting your search or filters.' : 'Get started by adding your first employee.'}
            action={
              hasFilters ? (
                <button type="button" className="btn btn-secondary" onClick={resetFilters}>
                  Clear all filters
                </button>
              ) : undefined
            }
          />
        )}

        {!loading && !error && employees.length > 0 && meta && (
          <>
            <p className="table-summary" data-testid="results-summary">
              Showing {from}–{to} of {meta.total} employees
            </p>
            <div className="table-wrapper">
              <table className="table" aria-label="Employees">
                <thead>
                  <tr>
                    {COLUMNS.map((c) => {
                      const active = sortBy === c.key;
                      return (
                        <th
                          key={c.key}
                          scope="col"
                          aria-sort={active ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <button type="button" className="sort-button" onClick={() => toggleSort(c.key)}>
                            {c.label}
                            <span className="sort-indicator" aria-hidden="true">
                              {active ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                            </span>
                          </button>
                        </th>
                      );
                    })}
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e.id}>
                      <td>{e.employeeCode}</td>
                      <td>
                        <div className="cell-person">
                          <Avatar firstName={e.firstName} lastName={e.lastName} src={e.avatarUrl} />
                          <span>{e.fullName}</span>
                        </div>
                      </td>
                      <td>{e.email}</td>
                      <td>{e.department.name}</td>
                      <td>{e.role.name}</td>
                      <td>
                        <StatusBadge status={e.status} />
                      </td>
                      <td>{formatDate(e.joiningDate)}</td>
                      <td>
                        <div className="row-actions">
                          <Link to={`/employees/${e.id}`} className="btn btn-ghost btn-sm" aria-label={`View ${e.fullName}`}>
                            View
                          </Link>
                          {isAdmin && (
                            <>
                              <Link
                                to={`/employees/${e.id}/edit`}
                                className="btn btn-ghost btn-sm"
                                aria-label={`Edit ${e.fullName}`}
                              >
                                Edit
                              </Link>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm text-danger"
                                aria-label={`Delete ${e.fullName}`}
                                onClick={() => setToDelete(e)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <div className="field field-inline">
                <label htmlFor="page-size">Rows per page</label>
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={(e) => updateParams({ pageSize: e.target.value === '10' ? null : e.target.value })}
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <Pagination page={meta.page} totalPages={meta.totalPages} onChange={(p) => updateParams({ page: p === 1 ? null : p }, false)} />
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete employee"
        message={`Are you sure you want to delete this employee? ${toDelete?.fullName ?? ''} (${toDelete?.employeeCode ?? ''}) will be permanently removed.`}
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
