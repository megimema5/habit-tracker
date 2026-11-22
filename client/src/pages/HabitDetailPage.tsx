import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/layout';
import {
  CheckInButton,
  HabitDays,
  HabitFormModal,
  HabitIcon,
  YearHeatmap,
} from '../components/habits';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../components/ui';
import { ApiRequestError } from '../api/client';
import { useDisclosure } from '../hooks/common/useDisclosure';
import { useToday } from '../hooks/common/useToday';
import { HISTORY_DAYS, useHabit } from '../hooks/habits/useHabit';
import { useDeleteHabit } from '../hooks/habits/useHabitMutations';
import { useHabitYear, YEAR_DAYS } from '../hooks/habits/useHabitYear';
import { useLogHabit } from '../hooks/habits/useLogHabit';
import { lastNDays } from '../utils/dates';
import { describeSchedule } from '../utils/habits';
import styles from './HabitDetailPage.module.css';
import { useDocumentTitle } from '../hooks/common/useDocumentTitle';

/** One habit: key numbers, today's check-in and the last 30 days. */
export function HabitDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const today = useToday();
  const navigate = useNavigate();
  const { data: habit, isPending, isError, error, refetch } = useHabit(id);
  const logHabit = useLogHabit();
  const year = useHabitYear(id);
  const deleteHabit = useDeleteHabit();
  const form = useDisclosure();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  useDocumentTitle(habit?.name ?? 'Habit');

  const notFound =
    !Number.isInteger(id) || id <= 0 || (error instanceof ApiRequestError && error.status === 404);

  if (notFound) {
    return (
      <EmptyState
        icon="🔍"
        title="Habit not found"
        description="It may have been deleted, or the link is wrong."
        action={
          <Button variant="secondary" onClick={() => void navigate('/habits')}>
            Back to habits
          </Button>
        }
      />
    );
  }

  if (isPending) {
    return (
      <div className={styles.loading} aria-busy="true" aria-label="Loading habit">
        <Skeleton height={56} />
        <Skeleton height={120} />
        <Skeleton height={180} />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="This habit could not be loaded." onRetry={() => void refetch()} />;
  }

  const doneLast30 = habit.logs.filter((log) => log.status === 'done').length;

  async function handleDelete() {
    if (!habit) return;
    await deleteHabit.mutateAsync({ id: habit.id, name: habit.name });
    void navigate('/habits', { replace: true });
  }

  return (
    <>
      <Link to="/habits" className={styles.back}>
        ← All habits
      </Link>

      <div className={styles.heading}>
        <HabitIcon icon={habit.icon} color={habit.color} size={56} />
        <div className={styles.headingText}>
          <PageHeader
            title={habit.name}
            subtitle={
              <span className={styles.subtitle}>
                {describeSchedule(habit)}
                {habit.reminderTime && <> · ⏰ {habit.reminderTime}</>}
                {habit.category && <Badge color={habit.color}>{habit.category}</Badge>}
              </span>
            }
            actions={
              <>
                <Button variant="secondary" leftIcon="edit" onClick={form.open}>
                  Edit
                </Button>
                <Button variant="ghost" leftIcon="trash" onClick={() => setConfirmingDelete(true)}>
                  Delete
                </Button>
              </>
            }
          />
        </div>
      </div>

      <div className={styles.stats}>
        {habit.currentStreak !== null && habit.longestStreak !== null ? (
          <>
            <Card className={styles.stat}>
              <span className={styles.statLabel}>Current streak</span>
              <span className={styles.statValue}>🔥 {habit.currentStreak}</span>
              <span className={styles.statHint}>{habit.currentStreak === 1 ? 'day' : 'days'}</span>
            </Card>
            <Card className={styles.stat}>
              <span className={styles.statLabel}>Best streak</span>
              <span className={styles.statValue}>{habit.longestStreak}</span>
              <span className={styles.statHint}>{habit.longestStreak === 1 ? 'day' : 'days'}</span>
            </Card>
          </>
        ) : (
          habit.weekProgress && (
            <Card className={styles.stat}>
              <span className={styles.statLabel}>This week</span>
              <span className={styles.statValue}>
                {habit.weekProgress.done} / {habit.weekProgress.target}
              </span>
              <span className={styles.statHint}>done</span>
            </Card>
          )
        )}
        <Card className={styles.stat}>
          <span className={styles.statLabel}>Last {HISTORY_DAYS} days</span>
          <span className={styles.statValue}>{doneLast30}</span>
          <span className={styles.statHint}>{doneLast30 === 1 ? 'time' : 'times'} done</span>
        </Card>
        <Card className={styles.stat}>
          <span className={styles.statLabel}>Today</span>
          <CheckInButton
            habitName={habit.name}
            color={habit.color}
            status={habit.todayStatus}
            onChange={(status) => logHabit.mutate({ habitId: habit.id, date: today, status })}
          />
        </Card>
      </div>

      <Card padding="lg">
        <h2 className={styles.sectionTitle}>Last {HISTORY_DAYS} days</h2>
        <p className={styles.sectionHint}>Click a day to mark it done, skipped or clear it.</p>
        <HabitDays
          habit={habit}
          dates={lastNDays(HISTORY_DAYS, today)}
          today={today}
          variant="grid"
          onChange={(date, status) => logHabit.mutate({ habitId: habit.id, date, status })}
        />
        <ul className={styles.legend} role="list" aria-label="Legend">
          <li>
            <span className={styles.swatchDone} style={{ background: habit.color }} /> Done
          </li>
          <li>
            <span className={styles.swatchSkipped} /> Skipped
          </li>
          <li>
            <span className={styles.swatchMissed} /> Missed
          </li>
          <li>
            <span className={styles.swatchOff} /> Not scheduled
          </li>
        </ul>
      </Card>

      <Card padding="lg" className={styles.yearCard}>
        <h2 className={styles.sectionTitle}>Last 12 months</h2>
        {year.data ? (
          <YearHeatmap habit={year.data} today={today} days={YEAR_DAYS} />
        ) : (
          <Skeleton height={120} />
        )}
      </Card>

      <HabitFormModal isOpen={form.isOpen} onClose={form.close} habit={habit} />

      <ConfirmDialog
        isOpen={confirmingDelete}
        title={`Delete “${habit.name}”?`}
        message="This removes the habit and all of its history. This can't be undone."
        confirmLabel="Delete habit"
        danger
        loading={deleteHabit.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}
