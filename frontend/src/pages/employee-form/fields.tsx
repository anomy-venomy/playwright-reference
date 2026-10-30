import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { useFormContext, type RegisterOptions } from 'react-hook-form';
import { FormField, describedBy } from '../../components/FormField';
import type { EmployeeFormValues, FieldName } from './formModel';

type BaseProps = { name: FieldName; label: string; hint?: string; required?: boolean };

function useField(name: FieldName, hint?: string, options?: RegisterOptions<EmployeeFormValues, FieldName>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();
  const error = errors[name]?.message as string | undefined;
  return {
    error,
    controlProps: {
      id: name,
      'aria-invalid': !!error,
      'aria-describedby': describedBy(name, error, hint),
      ...register(name, options),
    },
  };
}

export function TextInput({
  name,
  label,
  hint,
  required,
  ...rest
}: BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  const { error, controlProps } = useField(name, hint);
  return (
    <FormField id={name} label={label} error={error} hint={hint} required={required}>
      <input {...rest} {...controlProps} />
    </FormField>
  );
}

export function TextArea({ name, label, hint, required, rows = 3 }: BaseProps & { rows?: number }) {
  const { error, controlProps } = useField(name, hint);
  return (
    <FormField id={name} label={label} error={error} hint={hint} required={required}>
      <textarea rows={rows} {...controlProps} />
    </FormField>
  );
}

export function SelectInput({
  name,
  label,
  hint,
  required,
  placeholder,
  children,
  onValueChange,
  ...rest
}: BaseProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'> & {
    placeholder?: string;
    children: ReactNode;
    /** Runs after the form value updates — used to reset dependent dropdowns. */
    onValueChange?: (value: string) => void;
  }) {
  const { error, controlProps } = useField(name, hint, {
    onChange: (e) => onValueChange?.(e.target.value),
  });
  return (
    <FormField id={name} label={label} error={error} hint={hint} required={required}>
      <select {...rest} {...controlProps}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {children}
      </select>
    </FormField>
  );
}
