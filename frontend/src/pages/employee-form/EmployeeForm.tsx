import { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { employeeService } from '../../services/employeeService';
import { ApiError } from '../../services/api';
import { Spinner } from '../../components/Spinner';
import { ErrorState } from '../../components/StateMessages';
import { EMPTY_VALUES, STEPS, STEP_FIELDS, employeeResolver, stepOfField, toPayload, type EmployeeFormValues, type FieldName } from './formModel';
import { useFormOptions } from './useFormOptions';
import { Stepper } from './Stepper';
import { StepPersonal } from './StepPersonal';
import { StepProfessional } from './StepProfessional';
import { StepAddress } from './StepAddress';
import { StepReview } from './StepReview';
import type { AvatarState } from './AvatarUpload';

interface Props {
  mode: 'create' | 'edit';
  employeeId?: number;
  initialValues?: EmployeeFormValues;
  initialAvatarUrl?: string | null;
}

const LAST_STEP = STEPS.length - 1;

/**
 * The 4-step create/edit employee wizard. One react-hook-form instance holds every step's values,
 * so moving between steps never loses data.
 */
export function EmployeeForm({ mode, employeeId, initialValues, initialAvatarUrl = null }: Props) {
  const isEdit = mode === 'edit';
  const toast = useToast();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [step, setStep] = useState(0);
  // In edit mode every step already holds valid data, so all steps are reachable from the start.
  const [maxReached, setMaxReached] = useState(isEdit ? LAST_STEP : 0);
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const [avatar, setAvatar] = useState<AvatarState>({
    file: null,
    previewUrl: initialAvatarUrl,
    existingUrl: initialAvatarUrl,
    error: null,
  });

  const methods = useForm<EmployeeFormValues>({
    defaultValues: initialValues ?? EMPTY_VALUES,
    resolver: employeeResolver,
    mode: 'onTouched',
  });
  const { handleSubmit, trigger, setError, setValue, getValues, watch, formState } = methods;
  const { options, error: optionsError, retry } = useFormOptions(watch('departmentId'));

  // Suggest the next free employee ID for new employees.
  useEffect(() => {
    if (isEdit) return;
    employeeService
      .nextCode()
      .then((code) => {
        if (!getValues('employeeCode')) setValue('employeeCode', code);
      })
      .catch(() => undefined);
  }, [isEdit, getValues, setValue]);

  // Once a field shows an error, re-check it on every change so the message clears as soon as it's fixed
  // (by default 'onTouched' would wait for blur, which programmatic changes never trigger).
  useEffect(() => {
    const sub = watch((_values, { name, type }) => {
      if (type === 'change' && name && methods.getFieldState(name).error) void trigger(name);
    });
    return () => sub.unsubscribe();
  }, [watch, trigger, methods]);

  // Move focus to the step heading so keyboard/screen-reader users know the step changed.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const submitting = submitPhase !== 'idle';
  const avatarChanged = avatar.file !== null || avatar.previewUrl !== avatar.existingUrl;
  const hasUnsavedChanges = formState.isDirty || avatarChanged;

  function goTo(target: number) {
    setStep(target);
    setMaxReached((m) => Math.max(m, target));
  }

  async function next() {
    if (step === 0 && avatar.error) return;
    const valid = await trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (valid) goTo(step + 1);
  }

  async function selectStep(target: number) {
    if (target < step) return setStep(target);
    // Going forward: the current step must be valid first.
    const valid = await trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (valid) goTo(target);
  }

  function cancel() {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave this page?')) return;
    navigate(isEdit ? `/employees/${employeeId}` : '/employees');
  }

  async function onValid(values: EmployeeFormValues) {
    try {
      let avatarUrl = avatar.previewUrl ? avatar.existingUrl : null;
      if (avatar.file) {
        setSubmitPhase('uploading');
        avatarUrl = await employeeService.uploadAvatar(avatar.file);
      }
      setSubmitPhase('saving');
      const payload = toPayload(values, avatarUrl);
      const saved = isEdit ? await employeeService.update(employeeId!, payload) : await employeeService.create(payload);
      toast.success(isEdit ? 'Employee updated successfully' : 'Employee created successfully');
      navigate(`/employees/${saved.id}`);
    } catch (err) {
      setSubmitPhase('idle');
      const action = isEdit ? 'update' : 'create';
      if (err instanceof ApiError) {
        // Show field-level errors from the server and jump to the first step that has one.
        const fields = Object.entries(err.details ?? {}).filter(([f]) => f in EMPTY_VALUES);
        fields.forEach(([field, message]) => setError(field as FieldName, { type: 'server', message }));
        if (fields.length) setStep(Math.min(...fields.map(([f]) => stepOfField(f))));
        toast.error(`Failed to ${action} employee. ${err.message}`);
      } else {
        toast.error(`Failed to ${action} employee. Please try again.`);
      }
    }
  }

  function onInvalid(errors: Partial<Record<FieldName, unknown>>) {
    const first = Math.min(...Object.keys(errors).map(stepOfField));
    setStep(first);
    toast.error('Please fix the highlighted errors before submitting.');
  }

  if (optionsError) return <ErrorState message="Unable to load form options. Please try again." onRetry={retry} />;
  if (!options) return <Spinner label="Loading form..." />;

  return (
    <FormProvider {...methods}>
      <Stepper current={step} maxReached={maxReached} onSelect={selectStep} />

      <form
        className="card wizard"
        noValidate
        aria-label={isEdit ? 'Edit employee form' : 'Create employee form'}
        onSubmit={(e) => {
          e.preventDefault();
          // Pressing Enter on steps 1–3 moves forward instead of submitting.
          if (step < LAST_STEP) void next();
          else void handleSubmit(onValid, onInvalid)(e);
        }}
      >
        <h2 ref={headingRef} tabIndex={-1} className="wizard-heading">
          Step {step + 1} of {STEPS.length}: {STEPS[step].title}
        </h2>

        <div className="wizard-body">
          {step === 0 && <StepPersonal avatar={avatar} onAvatarChange={setAvatar} />}
          {step === 1 && <StepProfessional options={options} employeeId={employeeId} />}
          {step === 2 && <StepAddress options={options} />}
          {step === 3 && <StepReview options={options} avatar={avatar} onEditStep={setStep} />}
        </div>

        <div className="wizard-actions">
          <button type="button" className="btn btn-ghost" onClick={cancel} disabled={submitting}>
            Cancel
          </button>
          <div className="button-row">
            {step > 0 && (
              <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)} disabled={submitting}>
                Back
              </button>
            )}
            {/* Distinct keys matter: if React reused one <button> for both, the click on "Next" could flip
                its type to "submit" mid-click (after trigger() resolves) and submit the form early. */}
            {step < LAST_STEP ? (
              <button key="next" type="button" className="btn btn-primary" onClick={next}>
                Next
              </button>
            ) : (
              <button key="submit" type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
                {submitPhase === 'uploading'
                  ? 'Uploading image...'
                  : submitPhase === 'saving'
                    ? isEdit
                      ? 'Updating...'
                      : 'Submitting...'
                    : isEdit
                      ? 'Update Employee'
                      : 'Submit Employee'}
              </button>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
