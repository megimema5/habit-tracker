import { useId } from 'react';
import { HABIT_ICONS } from '@habit/shared';
import styles from '../ChoiceGroup/ChoiceGroup.module.css';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  options?: readonly string[];
  label?: string;
}

/** A small grid of preset emoji icons, built on radio buttons like ColorPicker. */
export function EmojiPicker({
  value,
  onChange,
  options = HABIT_ICONS,
  label = 'Icon',
}: EmojiPickerProps) {
  const name = useId();

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.options}>
        {options.map((emoji, index) => {
          const id = `${name}-${index}`;
          return (
            <span key={emoji}>
              <input
                type="radio"
                id={id}
                name={name}
                value={emoji}
                checked={value === emoji}
                onChange={() => onChange(emoji)}
                className={styles.radio}
              />
              <label htmlFor={id} className={styles.option}>
                <span className={styles.emoji}>{emoji}</span>
              </label>
            </span>
          );
        })}
      </div>
    </fieldset>
  );
}
