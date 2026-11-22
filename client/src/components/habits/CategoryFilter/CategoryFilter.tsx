import { cn } from '../../../utils/cn';
import styles from './CategoryFilter.module.css';

interface CategoryFilterProps {
  categories: string[];
  value: string | null;
  onChange: (category: string | null) => void;
}

/** "All · Health · Study …" chips to filter the habit list. */
export function CategoryFilter({ categories, value, onChange }: CategoryFilterProps) {
  const options: { label: string; value: string | null }[] = [
    { label: 'All', value: null },
    ...categories.map((category) => ({ label: category, value: category })),
  ];

  return (
    <div className={styles.filter} role="group" aria-label="Filter by category">
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          className={cn(styles.chip, value === option.value && styles.active)}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
