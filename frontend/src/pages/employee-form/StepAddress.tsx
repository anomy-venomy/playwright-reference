import { useFormContext } from 'react-hook-form';
import type { EmployeeFormValues } from './formModel';
import type { FormOptions } from './useFormOptions';
import { SelectInput, TextArea, TextInput } from './fields';

export function StepAddress({ options }: { options: FormOptions }) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();
  const country = watch('country');
  const state = watch('state');
  const selectedSkills = watch('skills') ?? [];

  const states = country ? Object.keys(options.locations[country] ?? {}) : [];
  const cities = country && state ? (options.locations[country]?.[state] ?? []) : [];
  const skillsError = errors.skills?.message;

  return (
    <>
      <TextArea name="address" label="Address" hint="Street address, building, apartment" required />

      <div className="grid-2">
        <SelectInput
          name="country"
          label="Country"
          placeholder="Select country"
          required
          onValueChange={() => {
            setValue('state', '');
            setValue('city', '');
          }}
        >
          {Object.keys(options.locations).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectInput>
        <SelectInput
          name="state"
          label="State"
          placeholder={country ? 'Select state' : 'Select a country first'}
          disabled={!country}
          required
          onValueChange={() => setValue('city', '')}
        >
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectInput>
      </div>

      <div className="grid-2">
        <SelectInput name="city" label="City" placeholder={state ? 'Select city' : 'Select a state first'} disabled={!state} required>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectInput>
        <TextInput name="pincode" label="Pincode" placeholder="302001" required />
      </div>

      <fieldset className={`field ${skillsError ? 'field-invalid' : ''}`} aria-describedby={skillsError ? 'skills-error' : 'skills-hint'}>
        <legend>
          Skills
          <span className="required" aria-hidden="true">
            {' '}
            *
          </span>
        </legend>
        <div className="skill-options">
          {options.skills.map((skill) => (
            <label key={skill} className={`skill-chip ${selectedSkills.includes(skill) ? 'selected' : ''}`}>
              <input type="checkbox" value={skill} {...register('skills')} />
              {skill}
            </label>
          ))}
        </div>
        {skillsError ? (
          <p id="skills-error" className="field-error" role="alert">
            {skillsError}
          </p>
        ) : (
          <p id="skills-hint" className="field-hint" data-testid="skills-count">
            {selectedSkills.length} selected (choose 1–10)
          </p>
        )}
      </fieldset>

      <h3 className="form-subheading">Emergency Contact</h3>
      <div className="grid-2">
        <TextInput name="emergencyContactName" label="Emergency contact name" required />
        <TextInput name="emergencyContactPhone" label="Emergency contact phone" type="tel" placeholder="+919876543210" required />
      </div>
    </>
  );
}
