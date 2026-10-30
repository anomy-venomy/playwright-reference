import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ApiError } from '../services/api';
import { FormField, describedBy } from '../components/FormField';
import { emailRules, nameRules } from '../utils/validation';

interface SignupForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export function SignupPage() {
  useDocumentTitle('Sign up');
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', acceptTerms: false },
  });

  async function onSubmit(values: SignupForm) {
    setFormError(null);
    try {
      await signup(values);
      toast.success('Account created successfully');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        for (const [field, message] of Object.entries(err.details)) {
          setError(field as keyof SignupForm, { type: 'server', message });
        }
      }
      setFormError(err instanceof ApiError ? err.message : 'Signup failed. Please try again.');
    }
  }

  return (
    <>
      <h1>Create your account</h1>
      <p className="muted">Start managing your team in minutes.</p>

      {formError && (
        <div className="alert alert-error" role="alert">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Signup form">
        <div className="grid-2">
          <FormField id="firstName" label="First name" error={errors.firstName?.message} required>
            <input
              id="firstName"
              autoComplete="given-name"
              aria-invalid={!!errors.firstName}
              aria-describedby={describedBy('firstName', errors.firstName?.message)}
              {...register('firstName', nameRules('First name'))}
            />
          </FormField>
          <FormField id="lastName" label="Last name" error={errors.lastName?.message} required>
            <input
              id="lastName"
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
              aria-describedby={describedBy('lastName', errors.lastName?.message)}
              {...register('lastName', nameRules('Last name'))}
            />
          </FormField>
        </div>

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

        <FormField
          id="password"
          label="Password"
          error={errors.password?.message}
          hint="At least 8 characters, including a letter and a number."
          required
        >
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={describedBy('password', errors.password?.message, 'hint')}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              validate: {
                letter: (v) => /[A-Za-z]/.test(v) || 'Password must contain at least one letter',
                number: (v) => /[0-9]/.test(v) || 'Password must contain at least one number',
              },
            })}
          />
        </FormField>

        <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message} required>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={describedBy('confirmPassword', errors.confirmPassword?.message)}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (v, all) => v === all.password || 'Passwords do not match',
            })}
          />
        </FormField>

        <div className={`field ${errors.acceptTerms ? 'field-invalid' : ''}`}>
          <label className="checkbox">
            <input
              type="checkbox"
              aria-invalid={!!errors.acceptTerms}
              aria-describedby={errors.acceptTerms ? 'acceptTerms-error' : undefined}
              {...register('acceptTerms', { required: 'You must accept the terms and conditions' })}
            />
            I agree to the Terms &amp; Conditions
          </label>
          {errors.acceptTerms && (
            <p id="acceptTerms-error" className="field-error" role="alert">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </>
  );
}
