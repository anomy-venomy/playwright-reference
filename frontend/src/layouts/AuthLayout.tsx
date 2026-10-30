import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <span className="logo" aria-hidden="true">
          W
        </span>
        <span>WorkFlow Manager</span>
      </div>
      <main className="auth-card">
        <Outlet />
      </main>
    </div>
  );
}
