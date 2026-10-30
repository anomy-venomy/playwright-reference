import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { profileService } from '../services/metaService';
import { ApiError } from '../services/api';
import { FormField, describedBy } from '../components/FormField';
import { Avatar } from '../components/Avatar';
import { formatDate } from '../utils/format';
import { nameRules, phoneRules } from '../utils/validation';

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
}

export function ProfilePage() {
  useDocumentTitle('My Profile');
  const { user, setUser } = useAuth();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    defaultValues: { firstName: user!.firstName, lastName: user!.lastName, phone: user!.phone ?? '' },
  });

  useEffect(() => {
    reset({ firstName: user!.firstName, lastName: user!.lastName, phone: user!.phone ?? '' });
  }, [user, reset]);

  async function onSubmit(values: ProfileForm) {
    try {
      const updated = await profileService.update({ ...values, phone: values.phone.trim() || null });
      setUser(updated);
      toast.success('Profile updated successfully');
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        for (const [field, message] of Object.entries(err.details)) {
          setError(field as keyof ProfileForm, { type: 'server', message });
        }
      }
      toast.error(`Failed to update profile. ${err instanceof ApiError ? err.message : ''}`.trim());
    }
  }

  const u = user!;
  return (
    <>
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      <div className="profile-grid">
        <section className="card" aria-labelledby="account-heading">
          <div className="profile-heading">
            <Avatar firstName={u.firstName} lastName={u.lastName} size="lg" />
            <div>
              <h2 id="account-heading" data-testid="profile-name">
                {u.firstName} {u.lastName}
              </h2>
              <p className="muted">{u.role === 'ADMIN' ? 'Administrator' : 'Viewer'}</p>
            </div>
          </div>
          <dl className="detail-list">
            <div className="detail-item">
              <dt>Email</dt>
              <dd>{u.email}</dd>
            </div>
            <div className="detail-item">
              <dt>Phone</dt>
              <dd>{u.phone || '—'}</dd>
            </div>
            <div className="detail-item">
              <dt>Member since</dt>
              <dd>{formatDate(u.createdAt)}</dd>
            </div>
          </dl>
        </section>

        <section className="card" aria-labelledby="edit-profile-heading">
          <h2 id="edit-profile-heading">Edit Profile</h2>
          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Edit profile form">
            <FormField id="firstName" label="First name" error={errors.firstName?.message} required>
              <input
                id="firstName"
                aria-invalid={!!errors.firstName}
                aria-describedby={describedBy('firstName', errors.firstName?.message)}
                {...register('firstName', nameRules('First name'))}
              />
            </FormField>
            <FormField id="lastName" label="Last name" error={errors.lastName?.message} required>
              <input
                id="lastName"
                aria-invalid={!!errors.lastName}
                aria-describedby={describedBy('lastName', errors.lastName?.message)}
                {...register('lastName', nameRules('Last name'))}
              />
            </FormField>
            <FormField id="phone" label="Phone" error={errors.phone?.message} hint="Optional. 10–15 digits, e.g. +919876543210">
              <input
                id="phone"
                type="tel"
                placeholder="+919876543210"
                aria-invalid={!!errors.phone}
                aria-describedby={describedBy('phone', errors.phone?.message, 'hint')}
                {...register('phone', phoneRules('Phone', false))}
              />
            </FormField>
            <div className="field">
              <label htmlFor="profile-email">Email</label>
              <input id="profile-email" value={u.email} readOnly disabled />
              <p className="field-hint">Email cannot be changed.</p>
            </div>
            <div className="button-row">
              <button type="button" className="btn btn-secondary" disabled={!isDirty || isSubmitting} onClick={() => reset()}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!isDirty || isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
