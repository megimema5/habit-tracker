import { useId, type CSSProperties } from 'react';
import { HABIT_COLORS } from '@habit/shared';
import styles from '../ChoiceGroup/ChoiceGroup.module.css';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  colors?: readonly string[];
  label?: string;
}

/** Colour swatches built on real radio buttons → works with keyboard and screen readers. */
export function ColorPicker({
  value,
  onChange,
  colors = HABIT_COLORS,
  label = 'Colour',
}: ColorPickerProps) {
  const name = useId();

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.options}>
        {colors.map((color) => {
          const id = `${name}-${color}`;
          return (
            <span key={color}>
              <input
                type="radio"
                id={id}
                name={name}
                value={color}
                checked={value === color}
                onChange={() => onChange(color)}
                className={styles.radio}
              />
              <label htmlFor={id} className={styles.option} title={color}>
                <span
                  className={styles.swatch}
                  style={{ '--swatch': color } as CSSProperties}
                  aria-hidden="true"
                />
                <span className="visually-hidden">{color}</span>
              </label>
            </span>
          );
        })}
      </div>
    </fieldset>
  );
}
