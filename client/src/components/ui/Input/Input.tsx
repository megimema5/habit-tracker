import { useId, type ComponentProps } from 'react';
import { cn } from '../../../utils/cn';
import { describedBy, Field } from '../Field';
import fieldStyles from '../Field/Field.module.css';

interface InputProps extends ComponentProps<'input'> {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

export function Input({ label, error, hint, id, className, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field id={inputId} label={label} error={error} hint={hint}>
      <input
        id={inputId}
        className={cn(fieldStyles.control, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, error, hint)}
        {...rest}
      />
    </Field>
  );
}
