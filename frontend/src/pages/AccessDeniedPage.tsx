import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function AccessDeniedPage() {
  useDocumentTitle('Access denied');
  return (
    <section className="page-center">
      <p className="error-code">403</p>
      <h1>Access denied</h1>
      <p className="muted">You do not have permission to view this page. Ask an administrator for access.</p>
      <Link to="/employees" className="btn btn-primary">
        Back to Employees
      </Link>
    </section>
  );
}
