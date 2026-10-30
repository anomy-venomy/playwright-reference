import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ApiError } from '../services/api';
import { FormField, describedBy } from '../components/FormField';
import { safeRedirect } from '../utils/format';
import { emailRules } from '../utils/validation';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export function LoginPage() {
  useDocumentTitle('Login');
  const { login, sessionExpired } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ defaultValues: { email: '', password: '', rememberMe: false } });

  async function onSubmit(values: LoginForm) {
    setFormError(null);
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate(safeRedirect(params.get('redirect')), { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Login failed. Please try again.');
    }
  }

  return (
    <>
      <h1>Log in to your account</h1>
      <p className="muted">Welcome back! Please enter your details.</p>

      {sessionExpired && !formError && (
        <div className="alert alert-info" role="status">
          Your session has expired. Please log in again.
        </div>
      )}
      {formError && (
        <div className="alert alert-error" role="alert">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Login form">
        <FormField id="email" label="Email" error={errors.email?.message} required>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={!!errors.email}
            aria-describedby={describedBy('email', errors.email?.message)}
            {...register('email', emailRules)}
          />
        </FormField>

        <FormField id="password" label="Password" error={errors.password?.message} required>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={!!errors.password}
            aria-describedby={describedBy('password', errors.password?.message)}
            {...register('password', { required: 'Password is required' })}
          />
        </FormField>

        <div className="form-row-between">
          <label className="checkbox">
            <input type="checkbox" {...register('rememberMe')} />
            Remember me
          </label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="auth-footer">
        Don&apos;t have an account? <Link to="/signup">Sign up</Link>
      </p>
    </>
  );
}
