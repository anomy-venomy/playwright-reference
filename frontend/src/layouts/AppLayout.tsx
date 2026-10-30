import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/Avatar';

export function AppLayout() {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout().catch(() => undefined);
    toast.success('You have been logged out');
    navigate('/login', { replace: true });
  }

  const navClass = ({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo" aria-hidden="true">
            W
          </span>
          <span>WorkFlow Manager</span>
        </div>
        <nav aria-label="Main navigation">
          <ul>
            <li>
              <NavLink to="/dashboard" className={navClass}>
                Dashboard
              </NavLink>
            </li>
            <li>
              {/* `end` so this link isn't also highlighted on /employees/create */}
              <NavLink to="/employees" end className={navClass}>
                Employees
              </NavLink>
            </li>
            {isAdmin && (
              <li>
                <NavLink to="/employees/create" className={navClass}>
                  Create Employee
                </NavLink>
              </li>
            )}
            <li>
              <NavLink to="/profile" className={navClass}>
                Profile
              </NavLink>
            </li>
          </ul>
        </nav>
        <button type="button" className="btn btn-ghost sidebar-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-user" data-testid="current-user">
            <Avatar firstName={user!.firstName} lastName={user!.lastName} />
            <div>
              <div className="topbar-name">
                {user!.firstName} {user!.lastName}
              </div>
              <div className="muted small">{user!.role === 'ADMIN' ? 'Administrator' : 'Viewer'}</div>
            </div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
