import { useToast } from '../../../context/useToast';
import { useToday } from '../../../hooks/common/useToday';
import { useLogHabit } from '../../../hooks/habits/useLogHabit';
import { useDailyReminder } from '../../../hooks/reminders/useDailyReminder';
import { HabitIcon } from '../../habits';
import { Button, Modal } from '../../ui';
import styles from './DailyReminderModal.module.css';

/**
 * The in-app reminder: shown when the app opens and habits are still waiting today.
 * Each habit can be checked off right here. Closing (Esc, ✕ or "Later") snoozes it.
 */
export function DailyReminderModal() {
  const reminder = useDailyReminder();
  const logHabit = useLogHabit();
  const today = useToday();
  const { showToast } = useToast();
  const count = reminder.habits.length;

  function markDone(habitId: number) {
    logHabit.mutate({ habitId, date: today, status: 'done' });
    if (count === 1) {
      // Last one done: close it (as a snooze, so un-checking later doesn't re-open it).
      reminder.snooze();
      showToast('All done for today 🎉', 'success');
    }
  }

  return (
    <Modal
      isOpen={reminder.isOpen}
      onClose={reminder.snooze}
      title="Time for your habits"
      description={`You have ${count} ${count === 1 ? 'habit' : 'habits'} left for today.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={reminder.dismissForToday}>
            Don’t remind me today
          </Button>
          <Button variant="secondary" onClick={reminder.snooze}>
            Later
          </Button>
        </>
      }
    >
      <ul className={styles.list} role="list">
        {reminder.habits.map((habit) => (
          <li key={habit.id} className={styles.item}>
            <HabitIcon icon={habit.icon} color={habit.color} size={36} />
            <div className={styles.info}>
              <span className={styles.name}>{habit.name}</span>
              {habit.reminderTime && <span className={styles.time}>⏰ {habit.reminderTime}</span>}
            </div>
            <Button
              size="sm"
              leftIcon="check"
              onClick={() => markDone(habit.id)}
              aria-label={`Mark ${habit.name} as done`}
            >
              Done
            </Button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
