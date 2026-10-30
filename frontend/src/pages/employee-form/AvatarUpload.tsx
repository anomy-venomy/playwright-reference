import { useRef } from 'react';
import { validateImage } from '../../utils/validation';

export interface AvatarState {
  /** Newly chosen file that still needs uploading. */
  file: File | null;
  /** What to show: an object URL for a new file, or the saved /uploads/... URL. */
  previewUrl: string | null;
  /** The saved URL the employee currently has (edit mode). */
  existingUrl: string | null;
  error: string | null;
}

interface Props {
  value: AvatarState;
  onChange: (next: AvatarState) => void;
}

export function AvatarUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const error = validateImage(file);
    if (error) {
      onChange({ ...value, error });
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    if (value.file && value.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange({ ...value, file, previewUrl: URL.createObjectURL(file), error: null });
  }

  function remove() {
    if (value.file && value.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange({ ...value, file: null, previewUrl: null, error: null });
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className={`field avatar-upload ${value.error ? 'field-invalid' : ''}`}>
      <label htmlFor="avatar">Profile picture</label>
      <div className="avatar-upload-row">
        {value.previewUrl ? (
          <img src={value.previewUrl} alt="Profile picture preview" className="avatar avatar-lg" />
        ) : (
          <span className="avatar avatar-lg avatar-placeholder" aria-hidden="true">
            ?
          </span>
        )}
        <div className="avatar-upload-controls">
          <input
            ref={inputRef}
            id="avatar"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            aria-describedby={value.error ? 'avatar-error' : 'avatar-hint'}
            aria-invalid={!!value.error}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {value.file && <p className="small" data-testid="avatar-file-name">Selected: {value.file.name}</p>}
          {value.previewUrl && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={remove}>
              Remove image
            </button>
          )}
        </div>
      </div>
      {value.error ? (
        <p id="avatar-error" className="field-error" role="alert">
          {value.error}
        </p>
      ) : (
        <p id="avatar-hint" className="field-hint">
          Optional. JPG, PNG, WEBP or GIF, up to 2 MB.
        </p>
      )}
    </div>
  );
}
