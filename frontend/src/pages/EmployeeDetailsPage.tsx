import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { employeeService } from '../services/employeeService';
import { ApiError } from '../services/api';
import { Spinner } from '../components/Spinner';
import { ErrorState } from '../components/StateMessages';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Avatar } from '../components/Avatar';
import { EMPLOYMENT_TYPE_LABELS, GENDER_LABELS, formatDate, formatNumber } from '../utils/format';
import type { Employee } from '../types';

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <section className="card detail-section" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <dl className="detail-list">{children}</dl>
    </section>
  );
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="detail-item">
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  );
}

export function EmployeeDetailsPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useDocumentTitle(employee ? employee.fullName : 'Employee details');

  const load = useCallback(() => {
    const controller = new AbortController();
    setError(null);
    setEmployee(null);
    employeeService
      .get(id!, controller.signal)
      .then(setEmployee)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? { status: 404, message: 'Employee not found' }
            : { status: 500, message: 'Unable to load employee. Please try again.' },
        );
      });
    return () => controller.abort();
  }, [id]);

  useEffect(load, [load]);

  async function handleDelete() {
    if (!employee) return;
    setDeleting(true);
    try {
      await employeeService.remove(employee.id);
      toast.success('Employee deleted successfully');
      navigate('/employees', { replace: true });
    } catch (err) {
      toast.error(`Failed to delete employee. ${err instanceof ApiError ? err.message : ''}`.trim());
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  if (error?.status === 404) {
    return (
      <section className="page-center">
        <p className="error-code">404</p>
        <h1>Employee not found</h1>
        <p className="muted">This employee doesn&apos;t exist or may have been deleted.</p>
        <Link to="/employees" className="btn btn-primary">
          Back to Employees
        </Link>
      </section>
    );
  }
  if (error) return <ErrorState message={error.message} onRetry={load} />;
  if (!employee) return <Spinner label="Loading employee..." />;

  const e = employee;
  return (
    <>
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/employees">Employees</Link> <span aria-hidden="true">/</span> <span>{e.fullName}</span>
      </nav>

      <div className="page-header">
        <div className="profile-heading">
          <Avatar firstName={e.firstName} lastName={e.lastName} src={e.avatarUrl} size="lg" />
          <div>
            <h1>{e.fullName}</h1>
            <p className="muted">
              {e.employeeCode} · {e.role.name} · {e.department.name} <StatusBadge status={e.status} />
            </p>
          </div>
        </div>
        <div className="button-row">
          <Link to="/employees" className="btn btn-secondary">
            Back to Employees
          </Link>
          {isAdmin && (
            <>
              <Link to={`/employees/${e.id}/edit`} className="btn btn-primary">
                Edit
              </Link>
              <button type="button" className="btn btn-danger" onClick={() => setConfirmOpen(true)}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="details-grid">
        <Section title="Personal Information">
          <Item label="First name" value={e.firstName} />
          <Item label="Last name" value={e.lastName} />
          <Item label="Email" value={e.email} />
          <Item label="Phone" value={e.phone} />
          <Item label="Date of birth" value={formatDate(e.dateOfBirth)} />
          <Item label="Gender" value={GENDER_LABELS[e.gender]} />
        </Section>
        <Section title="Professional Information">
          <Item label="Employee ID" value={e.employeeCode} />
          <Item label="Department" value={e.department.name} />
          <Item label="Job role" value={e.role.name} />
          <Item label="Employment type" value={EMPLOYMENT_TYPE_LABELS[e.employmentType]} />
          <Item label="Joining date" value={formatDate(e.joiningDate)} />
          <Item label="Annual salary" value={formatNumber(e.salary)} />
          <Item label="Status" value={<StatusBadge status={e.status} />} />
          <Item
            label="Manager"
            value={e.manager ? <Link to={`/employees/${e.manager.id}`}>{e.manager.fullName}</Link> : 'No manager'}
          />
        </Section>
        <Section title="Address">
          <Item label="Address" value={e.address} />
          <Item label="City" value={e.city} />
          <Item label="State" value={e.state} />
          <Item label="Country" value={e.country} />
          <Item label="Pincode" value={e.pincode} />
        </Section>
        <section className="card detail-section" aria-labelledby="section-skills">
          <h2 id="section-skills">Skills</h2>
          <ul className="chip-list" aria-label="Skills">
            {e.skills.map((s) => (
              <li key={s} className="chip">
                {s}
              </li>
            ))}
          </ul>
        </section>
        <Section title="Emergency Contact">
          <Item label="Contact name" value={e.emergencyContactName} />
          <Item label="Contact phone" value={e.emergencyContactPhone} />
        </Section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete employee"
        message={`Are you sure you want to delete this employee? ${e.fullName} (${e.employeeCode}) will be permanently removed.`}
        pending={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
