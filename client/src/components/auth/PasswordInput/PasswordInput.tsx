import { useId, useState, type ComponentProps } from 'react';
import { cn } from '../../../utils/cn';
import { describedBy, Field, Icon } from '../../ui';
import fieldStyles from '../../ui/Field/Field.module.css';
import styles from './PasswordInput.module.css';

interface PasswordInputProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

/** Password field with a show/hide button (helps people check what they typed). */
export function PasswordInput({ label, error, hint, id, className, ...rest }: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <Field id={inputId} label={label} error={error} hint={hint}>
      <div className={styles.wrapper}>
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={cn(fieldStyles.control, styles.input, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          {...rest}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
    </Field>
  );
}
