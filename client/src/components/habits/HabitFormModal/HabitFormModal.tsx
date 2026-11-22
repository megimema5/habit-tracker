import { useId, useState, type FormEvent } from 'react';
import {
  createHabitSchema,
  DEFAULT_CATEGORIES,
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_ICON,
  LIMITS,
  type Habit,
  type ScheduleType,
} from '@habit/shared';
import { useCreateHabit, useUpdateHabit } from '../../../hooks/habits/useHabitMutations';
import { describeApiError, issuesToFieldErrors, type FieldErrors } from '../../../utils/formErrors';
import { Button, ColorPicker, EmojiPicker, Icon, Input, Modal } from '../../ui';
import { ScheduleSelector } from '../ScheduleSelector';
import styles from './HabitFormModal.module.css';

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pass a habit to edit it; leave empty to create a new one. */
  habit?: Habit | null;
}

/** Create and edit use the same modal — `habit` decides which one it is. */
export function HabitFormModal({ isOpen, onClose, habit }: HabitFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={habit ? 'Edit habit' : 'New habit'}
      description={habit ? undefined : 'Small and specific works best, e.g. “Read 10 pages”.'}
    >
      {/* Rendered only while open → the form starts fresh every time. */}
      <HabitForm habit={habit ?? null} onDone={onClose} />
    </Modal>
  );
}

interface FormValues {
  name: string;
  icon: string;
  color: string;
  category: string;
  scheduleType: ScheduleType;
  scheduleDays: number[];
  reminderTime: string;
}

function initialValues(habit: Habit | null): FormValues {
  return {
    name: habit?.name ?? '',
    icon: habit?.icon ?? DEFAULT_HABIT_ICON,
    color: habit?.color ?? DEFAULT_HABIT_COLOR,
    category: habit?.category ?? '',
    scheduleType: habit?.scheduleType ?? 'daily',
    scheduleDays: habit?.scheduleDays ?? [],
    reminderTime: habit?.reminderTime ?? '',
  };
}

function HabitForm({ habit, onDone }: { habit: Habit | null; onDone: () => void }) {
  const [values, setValues] = useState(() => initialValues(habit));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const categoriesId = useId();
  const saving = createHabit.isPending || updateHabit.isPending;

  function update<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    // Same rules as the server (shared zod schema) → instant feedback.
    const parsed = createHabitSchema.safeParse({
      ...values,
      category: values.category || null,
      reminderTime: values.reminderTime || null,
    });
    if (!parsed.success) {
      setErrors(issuesToFieldErrors(parsed.error.issues));
      return;
    }

    try {
      if (habit) await updateHabit.mutateAsync({ id: habit.id, changes: parsed.data });
      else await createHabit.mutateAsync(parsed.data);
      onDone();
    } catch (err) {
      const described = describeApiError(err);
      setErrors(described.fieldErrors);
      setFormError(described.formError);
    }
  }

  return (
    <form className={styles.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
      {formError && (
        <div className={styles.formError} role="alert">
          <Icon name="alert" size={18} />
          <span>{formError}</span>
        </div>
      )}

      <Input
        label="Name"
        value={values.name}
        onChange={(e) => update('name', e.target.value)}
        error={errors.name}
        maxLength={LIMITS.HABIT_NAME_MAX}
        placeholder="e.g. Drink 8 glasses of water"
        autoFocus
      />

      <EmojiPicker value={values.icon} onChange={(icon) => update('icon', icon)} />
      <ColorPicker value={values.color} onChange={(color) => update('color', color)} />

      <Input
        label="Category (optional)"
        value={values.category}
        onChange={(e) => update('category', e.target.value)}
        error={errors.category}
        maxLength={LIMITS.CATEGORY_MAX}
        list={categoriesId}
        placeholder="e.g. Health"
      />
      <datalist id={categoriesId}>
        {DEFAULT_CATEGORIES.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <ScheduleSelector
        scheduleType={values.scheduleType}
        scheduleDays={values.scheduleDays}
        onChange={(schedule) => {
          setValues((current) => ({ ...current, ...schedule }));
          if (errors.scheduleDays)
            setErrors((current) => ({ ...current, scheduleDays: undefined }));
        }}
        daysError={errors.scheduleDays}
      />

      <Input
        label="Reminder time (optional)"
        type="time"
        value={values.reminderTime}
        onChange={(e) => update('reminderTime', e.target.value)}
        error={errors.reminderTime}
        hint="Used by the daily reminder when you open the app."
      />

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {habit ? 'Save changes' : 'Create habit'}
        </Button>
      </div>
    </form>
  );
}
