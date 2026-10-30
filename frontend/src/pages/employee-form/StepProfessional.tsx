import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import type { EmployeeFormValues } from './formModel';
import type { FormOptions } from './useFormOptions';
import { SelectInput, TextInput } from './fields';

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
];

export function StepProfessional({ options, employeeId }: { options: FormOptions; employeeId?: number }) {
  const {
    register,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();
  const departmentId = watch('departmentId');

  // When roles arrive after the <select> mounted, re-apply the stored value so the DOM shows it.
  useEffect(() => {
    if (!options.rolesLoading) setValue('roleId', getValues('roleId'));
  }, [options.roles, options.rolesLoading, setValue, getValues]);
  const typeError = errors.employmentType?.message;

  return (
    <>
      <div className="grid-2">
        <TextInput name="employeeCode" label="Employee ID" placeholder="EMP-1234" hint="Format: EMP- followed by 4–6 digits" required />
        <SelectInput name="status" label="Status" required>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </SelectInput>
      </div>

      <div className="grid-2">
        <SelectInput
          name="departmentId"
          label="Department"
          placeholder="Select department"
          required
          onValueChange={() => setValue('roleId', '')}
        >
          {options.departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </SelectInput>
        <SelectInput
          name="roleId"
          label="Job role"
          placeholder={!departmentId ? 'Select a department first' : options.rolesLoading ? 'Loading roles...' : 'Select job role'}
          disabled={!departmentId || options.rolesLoading}
          required
        >
          {options.roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </SelectInput>
      </div>

      <fieldset className={`field radio-group ${typeError ? 'field-invalid' : ''}`} aria-describedby={typeError ? 'employmentType-error' : undefined}>
        <legend>
          Employment type
          <span className="required" aria-hidden="true">
            {' '}
            *
          </span>
        </legend>
        <div className="radio-options">
          {EMPLOYMENT_TYPES.map((t) => (
            <label key={t.value} className="radio">
              <input type="radio" value={t.value} {...register('employmentType')} />
              {t.label}
            </label>
          ))}
        </div>
        {typeError && (
          <p id="employmentType-error" className="field-error" role="alert">
            {typeError}
          </p>
        )}
      </fieldset>

      <div className="grid-2">
        <TextInput name="joiningDate" label="Joining date" type="date" required />
        <TextInput name="salary" label="Annual salary" type="number" inputMode="numeric" min={0} step={1000} placeholder="e.g. 1200000" required />
      </div>

      <SelectInput name="managerId" label="Reporting manager" placeholder="No manager" hint="Optional">
        {options.managers
          .filter((m) => m.id !== employeeId)
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName} ({m.employeeCode})
            </option>
          ))}
      </SelectInput>
    </>
  );
}
