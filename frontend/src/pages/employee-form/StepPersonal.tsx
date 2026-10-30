import { todayISO } from '../../utils/format';
import { AvatarUpload, type AvatarState } from './AvatarUpload';
import { SelectInput, TextInput } from './fields';

interface Props {
  avatar: AvatarState;
  onAvatarChange: (next: AvatarState) => void;
}

export function StepPersonal({ avatar, onAvatarChange }: Props) {
  return (
    <>
      <div className="grid-2">
        <TextInput name="firstName" label="First name" autoComplete="off" required />
        <TextInput name="lastName" label="Last name" autoComplete="off" required />
      </div>
      <div className="grid-2">
        <TextInput name="email" label="Email" type="email" placeholder="name@company.com" autoComplete="off" required />
        <TextInput name="phone" label="Phone" type="tel" placeholder="+919876543210" hint="10–15 digits, optionally starting with +" required />
      </div>
      <div className="grid-2">
        <TextInput name="dateOfBirth" label="Date of birth" type="date" max={todayISO(-18)} hint="Employee must be at least 18." required />
        <SelectInput name="gender" label="Gender" placeholder="Select gender" required>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </SelectInput>
      </div>
      <AvatarUpload value={avatar} onChange={onAvatarChange} />
    </>
  );
}
