import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { metaService } from '../services/metaService';
import { ApiError } from '../services/api';
import { Spinner } from '../components/Spinner';
import { ErrorState } from '../components/StateMessages';
import { StatusBadge } from '../components/StatusBadge';
import { Avatar } from '../components/Avatar';
import { formatDate } from '../utils/format';
import type { DashboardStats } from '../types';

function StatCard({ id, label, value, tone }: { id: string; label: string; value: number; tone: string }) {
  return (
    <section className={`stat-card stat-${tone}`} aria-labelledby={`${id}-label`}>
      <h2 id={`${id}-label`} className="stat-label">
        {label}
      </h2>
      <p className="stat-value" data-testid={`stat-${id}`}>
        {value}
      </p>
    </section>
  );
}

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setStats(null);
    metaService
      .dashboardStats()
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError && err.status !== 500 ? err.message : 'Unable to load dashboard. Please try again.'));
  }, []);

  useEffect(load, [load]);

  const maxDept = Math.max(1, ...(stats?.byDepartment.map((d) => d.count) ?? [1]));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Welcome back, <strong data-testid="welcome-name">{user?.firstName}</strong>! Here&apos;s what&apos;s happening
            with your team.
          </p>
        </div>
        {isAdmin && (
          <Link to="/employees/create" className="btn btn-primary">
            Add Employee
          </Link>
        )}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {!error && !stats && <Spinner label="Loading dashboard..." />}

      {stats && (
        <>
          <div className="stats-grid">
            <StatCard id="total" label="Total Employees" value={stats.totalEmployees} tone="primary" />
            <StatCard id="active" label="Active Employees" value={stats.activeEmployees} tone="success" />
            <StatCard id="inactive" label="Inactive Employees" value={stats.inactiveEmployees} tone="muted" />
          </div>

          <div className="dashboard-grid">
            <section className="card" aria-labelledby="recent-heading">
              <div className="card-header">
                <h2 id="recent-heading">Recent Employees</h2>
                <Link to="/employees">View all</Link>
              </div>
              {stats.recentEmployees.length === 0 ? (
                <p className="muted">No employees yet.</p>
              ) : (
                <ul className="recent-list" aria-label="Recent employees">
                  {stats.recentEmployees.map((e) => (
                    <li key={e.id}>
                      <Avatar firstName={e.firstName} lastName={e.lastName} src={e.avatarUrl} />
                      <div className="recent-main">
                        <Link to={`/employees/${e.id}`}>{e.fullName}</Link>
                        <span className="muted small">
                          {e.role.name} · {e.department.name}
                        </span>
                      </div>
                      <div className="recent-meta">
                        <StatusBadge status={e.status} />
                        <span className="muted small">Joined {formatDate(e.joiningDate)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card" aria-labelledby="dept-heading">
              <div className="card-header">
                <h2 id="dept-heading">Employees by Department</h2>
              </div>
              <ul className="dept-bars">
                {stats.byDepartment.map((d) => (
                  <li key={d.id}>
                    <div className="dept-bar-label">
                      <span>{d.name}</span>
                      <span>{d.count}</span>
                    </div>
                    <div className="dept-bar-track" aria-hidden="true">
                      <div className="dept-bar-fill" style={{ width: `${(d.count / maxDept) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </>
  );
}
