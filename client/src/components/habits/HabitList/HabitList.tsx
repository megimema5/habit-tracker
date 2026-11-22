import { Link } from 'react-router-dom';
import type { HabitWithStats } from '@habit/shared';
import { describeSchedule } from '../../../utils/habits';
import { Badge, IconButton } from '../../ui';
import { HabitIcon } from '../HabitIcon';
import { HabitStatsBadges } from '../HabitStatsBadges';
import styles from './HabitList.module.css';

interface HabitListProps {
  habits: HabitWithStats[];
  onEdit: (habit: HabitWithStats) => void;
  onDelete: (habit: HabitWithStats) => void;
}

/** Manage page list: one row per habit with edit / delete actions. */
export function HabitList({ habits, onEdit, onDelete }: HabitListProps) {
  return (
    <ul className={styles.list} role="list">
      {habits.map((habit) => (
        <li key={habit.id} className={styles.row}>
          <HabitIcon icon={habit.icon} color={habit.color} size={40} />
          <div className={styles.info}>
            <Link to={`/habits/${habit.id}`} className={styles.name}>
              {habit.name}
            </Link>
            <div className={styles.meta}>
              <span>{describeSchedule(habit)}</span>
              {habit.reminderTime && <span>· ⏰ {habit.reminderTime}</span>}
              {habit.category && <Badge color={habit.color}>{habit.category}</Badge>}
              <HabitStatsBadges habit={habit} />
            </div>
          </div>
          <div className={styles.actions}>
            <IconButton icon="edit" label={`Edit ${habit.name}`} onClick={() => onEdit(habit)} />
            <IconButton
              icon="trash"
              label={`Delete ${habit.name}`}
              variant="danger"
              onClick={() => onDelete(habit)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
