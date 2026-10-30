import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { authService } from '../services/authService';
import { ApiError } from '../services/api';
import { FormField, describedBy } from '../components/FormField';
import { emailRules } from '../utils/validation';

export function ForgotPasswordPage() {
  useDocumentTitle('Forgot password');
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ defaultValues: { email: '' } });

  async function onSubmit({ email }: { email: string }) {
    setFormError(null);
    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <>
      <h1>Forgot your password?</h1>
      <p className="muted">Enter your email and we&apos;ll send you a reset link.</p>

      {message ? (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Forgot password form">
          {formError && (
            <div className="alert alert-error" role="alert">
              {formError}
            </div>
          )}
          <FormField id="email" label="Email" error={errors.email?.message} required>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              aria-invalid={!!errors.email}
              aria-describedby={describedBy('email', errors.email?.message)}
              {...register('email', emailRules)}
            />
          </FormField>
          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="auth-footer">
        <Link to="/login">Back to login</Link>
      </p>
    </>
  );
}
