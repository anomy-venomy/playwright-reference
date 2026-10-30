import type { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import { EMPLOYMENT_TYPE_LABELS, GENDER_LABELS, STATUS_LABELS, formatDate, formatNumber } from '../../utils/format';
import type { EmployeeFormValues } from './formModel';
import type { FormOptions } from './useFormOptions';
import type { AvatarState } from './AvatarUpload';

interface Props {
  options: FormOptions;
  avatar: AvatarState;
  onEditStep: (step: number) => void;
}

function ReviewSection({
  step,
  title,
  onEdit,
  children,
}: {
  step: number;
  title: string;
  onEdit: (step: number) => void;
  children: ReactNode;
}) {
  const headingId = `review-step-${step + 1}`;
  return (
    <section className="review-section" aria-labelledby={headingId}>
      <div className="review-section-header">
        <h3 id={headingId}>{title}</h3>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(step)}>
          Edit Step {step + 1}
        </button>
      </div>
      <dl className="detail-list">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="detail-item">
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  );
}

export function StepReview({ options, avatar, onEditStep }: Props) {
  const v = useFormContext<EmployeeFormValues>().getValues();
  const department = options.departments.find((d) => String(d.id) === v.departmentId)?.name;
  const role = options.roles.find((r) => String(r.id) === v.roleId)?.name;
  const manager = options.managers.find((m) => String(m.id) === v.managerId);

  return (
    <div className="review">
      <p className="muted">Please review the details below before submitting.</p>

      <ReviewSection step={0} title="Personal Information" onEdit={onEditStep}>
        <Row
          label="Profile picture"
          value={avatar.previewUrl ? <img src={avatar.previewUrl} alt="Selected profile picture" className="avatar avatar-md" /> : 'Not provided'}
        />
        <Row label="Name" value={`${v.firstName} ${v.lastName}`} />
        <Row label="Email" value={v.email} />
        <Row label="Phone" value={v.phone} />
        <Row label="Date of birth" value={formatDate(v.dateOfBirth)} />
        <Row label="Gender" value={v.gender ? GENDER_LABELS[v.gender] : ''} />
      </ReviewSection>

      <ReviewSection step={1} title="Professional Information" onEdit={onEditStep}>
        <Row label="Employee ID" value={v.employeeCode.toUpperCase()} />
        <Row label="Department" value={department} />
        <Row label="Role" value={role} />
        <Row label="Employment type" value={v.employmentType ? EMPLOYMENT_TYPE_LABELS[v.employmentType] : ''} />
        <Row label="Joining date" value={formatDate(v.joiningDate)} />
        <Row label="Annual salary" value={v.salary ? formatNumber(Number(v.salary)) : ''} />
        <Row label="Status" value={STATUS_LABELS[v.status]} />
        <Row label="Manager" value={manager ? manager.fullName : 'No manager'} />
      </ReviewSection>

      <ReviewSection step={2} title="Address" onEdit={onEditStep}>
        <Row label="Address" value={v.address} />
        <Row label="City" value={v.city} />
        <Row label="State" value={v.state} />
        <Row label="Country" value={v.country} />
        <Row label="Pincode" value={v.pincode} />
        <Row label="Skills" value={v.skills.join(', ')} />
        <Row label="Emergency contact" value={`${v.emergencyContactName} (${v.emergencyContactPhone})`} />
      </ReviewSection>
    </div>
  );
}
