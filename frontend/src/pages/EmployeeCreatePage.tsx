import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { EmployeeForm } from './employee-form/EmployeeForm';

export function EmployeeCreatePage() {
  useDocumentTitle('Create Employee');
  return (
    <>
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/employees">Employees</Link> <span aria-hidden="true">/</span> <span>Create</span>
      </nav>
      <div className="page-header">
        <div>
          <h1>Create Employee</h1>
          <p className="muted">Fill in the details below to add a new employee.</p>
        </div>
      </div>
      <EmployeeForm mode="create" />
    </>
  );
}
