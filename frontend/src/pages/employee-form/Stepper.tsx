import { STEPS } from './formModel';

interface Props {
  current: number;
  maxReached: number;
  onSelect: (step: number) => void;
}

export function Stepper({ current, maxReached, onSelect }: Props) {
  return (
    <ol className="stepper" aria-label="Form progress">
      {STEPS.map((step, i) => {
        const state = i === current ? 'current' : i < current || i <= maxReached ? 'complete' : 'upcoming';
        return (
          <li key={step.title} className={`stepper-item stepper-${state}`} aria-current={i === current ? 'step' : undefined}>
            <button
              type="button"
              className="stepper-button"
              onClick={() => onSelect(i)}
              disabled={i > maxReached || i === current}
              aria-label={`Step ${i + 1}: ${step.title}`}
            >
              <span className="stepper-number" aria-hidden="true">
                {i < current ? '✓' : i + 1}
              </span>
              <span className="stepper-label">{step.short}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
