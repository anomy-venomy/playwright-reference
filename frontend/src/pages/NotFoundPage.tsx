import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <section className="page-center">
      <p className="error-code">404</p>
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for doesn&apos;t exist or has been moved.</p>
      <Link to="/dashboard" className="btn btn-primary">
        Go to Dashboard
      </Link>
    </section>
  );
}
