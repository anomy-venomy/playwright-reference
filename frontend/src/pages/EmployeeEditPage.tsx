import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { employeeService } from '../services/employeeService';
import { ApiError } from '../services/api';
import { Spinner } from '../components/Spinner';
import { ErrorState } from '../components/StateMessages';
import { EmployeeForm } from './employee-form/EmployeeForm';
import { fromEmployee } from './employee-form/formModel';
import type { Employee } from '../types';

export function EmployeeEditPage() {
  useDocumentTitle('Edit Employee');
  const { id } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<number | null>(null);

  const load = useCallback(() => {
    const controller = new AbortController();
    setError(null);
    setEmployee(null);
    employeeService
      .get(id!, controller.signal)
      .then(setEmployee)
      .catch((err) => !controller.signal.aborted && setError(err instanceof ApiError ? err.status : 500));
    return () => controller.abort();
  }, [id]);

  useEffect(load, [load]);

  if (error === 404) {
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
  if (error) return <ErrorState message="Unable to load employee. Please try again." onRetry={load} />;
  if (!employee) return <Spinner label="Loading employee..." />;

  return (
    <>
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/employees">Employees</Link> <span aria-hidden="true">/</span>{' '}
        <Link to={`/employees/${employee.id}`}>{employee.fullName}</Link> <span aria-hidden="true">/</span> <span>Edit</span>
      </nav>
      <div className="page-header">
        <div>
          <h1>Edit Employee</h1>
          <p className="muted">
            Editing <strong>{employee.fullName}</strong> ({employee.employeeCode})
          </p>
        </div>
      </div>
      {/* key forces a fresh form if the user navigates between two edit pages */}
      <EmployeeForm
        key={employee.id}
        mode="edit"
        employeeId={employee.id}
        initialValues={fromEmployee(employee)}
        initialAvatarUrl={employee.avatarUrl}
      />
    </>
  );
}
