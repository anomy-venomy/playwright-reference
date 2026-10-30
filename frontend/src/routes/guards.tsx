import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/Spinner';
import { safeRedirect } from '../utils/format';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';

function FullPageLoader() {
  return (
    <div className="full-page-center">
      <Spinner label="Loading..." />
    </div>
  );
}

/** Only for logged-in users. Others go to /login?redirect=<where they wanted to go>. */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'unauthenticated') {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return <Outlet />;
}

/** Login/signup pages: logged-in users are sent on to the app. */
export function PublicOnlyRoute() {
  const { status } = useAuth();
  const [params] = useSearchParams();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'authenticated') return <Navigate to={safeRedirect(params.get('redirect'))} replace />;
  return <Outlet />;
}

/** Pages that change data. VIEWER users see an access denied page instead. */
export function AdminRoute() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Outlet /> : <AccessDeniedPage />;
}
