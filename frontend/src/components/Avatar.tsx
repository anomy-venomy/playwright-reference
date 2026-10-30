import { initials } from '../utils/format';

interface Props {
  firstName: string;
  lastName: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ firstName, lastName, src, size = 'sm' }: Props) {
  if (src) return <img className={`avatar avatar-${size}`} src={src} alt={`${firstName} ${lastName}`} />;
  return (
    <span className={`avatar avatar-${size} avatar-initials`} aria-hidden="true">
      {initials(firstName, lastName)}
    </span>
  );
}
