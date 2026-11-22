import { useId, type ComponentProps } from 'react';
import { cn } from '../../../utils/cn';
import { describedBy, Field } from '../Field';
import fieldStyles from '../Field/Field.module.css';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<ComponentProps<'select'>, 'children'> {
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  error?: string | undefined;
  hint?: string | undefined;
}

export function Select({
  label,
  options,
  placeholder,
  error,
  hint,
  id,
  className,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field id={selectId} label={label} error={error} hint={hint}>
      <select
        id={selectId}
        className={cn(fieldStyles.control, styles.select, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(selectId, error, hint)}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
