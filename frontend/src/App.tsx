import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from './routes/guards';
import { AuthLayout } from './layouts/AuthLayout';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { EmployeeDetailsPage } from './pages/EmployeeDetailsPage';
import { EmployeeCreatePage } from './pages/EmployeeCreatePage';
import { EmployeeEditPage } from './pages/EmployeeEditPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/employees/create" element={<EmployeeCreatePage />} />
            <Route path="/employees/:id/edit" element={<EmployeeEditPage />} />
          </Route>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
