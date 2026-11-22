import { PageHeader } from '../components/layout';
import { HabitCard, HabitFormModal } from '../components/habits';
import { Button, Card, EmptyState, ErrorState, ProgressBar, Skeleton } from '../components/ui';
import { useDisclosure } from '../hooks/common/useDisclosure';
import { useToday } from '../hooks/common/useToday';
import { useHabits } from '../hooks/habits/useHabits';
import { formatDay } from '../utils/dates';
import styles from './TodayPage.module.css';
import { useDocumentTitle } from '../hooks/common/useDocumentTitle';

/** Main screen: today's habits with one-tap check-ins, streaks and the last 7 days. */
export function TodayPage() {
  useDocumentTitle('Today');
  const today = useToday();
  const { data: habits, isPending, isError, refetch } = useHabits();
  const form = useDisclosure();

  const dueToday = habits?.filter((habit) => habit.isScheduledToday) ?? [];
  const otherHabits = habits?.filter((habit) => !habit.isScheduledToday) ?? [];
  const doneCount = dueToday.filter((habit) => habit.todayStatus === 'done').length;
  const skippedCount = dueToday.filter((habit) => habit.todayStatus === 'skipped').length;
  const target = dueToday.length - skippedCount;
  const allDone = target > 0 && doneCount >= target;

  return (
    <>
      <PageHeader
        title="Today"
        subtitle={formatDay(today, { weekday: 'long', day: 'numeric', month: 'long' })}
        actions={
          habits && habits.length > 0 ? (
            <Button leftIcon="plus" onClick={form.open}>
              New habit
            </Button>
          ) : undefined
        }
      />

      {isPending && (
        <div className={styles.list} aria-busy="true" aria-label="Loading habits">
          <Skeleton height={72} />
          <Skeleton height={140} />
          <Skeleton height={140} />
        </div>
      )}

      {isError && (
        <ErrorState message="Your habits could not be loaded." onRetry={() => void refetch()} />
      )}

      {habits && habits.length === 0 && (
        <EmptyState
          icon="🌱"
          title="Start your first habit"
          description="Pick something small you want to do regularly — drinking water, reading, a short walk. You can add more later."
          action={
            <Button leftIcon="plus" onClick={form.open}>
              Create a habit
            </Button>
          }
        />
      )}

      {habits && habits.length > 0 && (
        <div className={styles.list}>
          {dueToday.length > 0 && (
            <Card className={styles.summary}>
              <div className={styles.summaryText}>
                <p className={styles.summaryTitle}>
                  {allDone ? 'All done for today 🎉' : `${doneCount} of ${target} done today`}
                </p>
                {skippedCount > 0 && <p className={styles.summaryHint}>{skippedCount} skipped</p>}
              </div>
              <ProgressBar
                value={doneCount}
                max={Math.max(target, 1)}
                label="Habits done today"
                color={allDone ? 'var(--color-success)' : undefined}
              />
            </Card>
          )}

          {dueToday.length > 0 ? (
            <section aria-labelledby="due-today" className={styles.section}>
              <h2 id="due-today" className={styles.sectionTitle}>
                Due today
              </h2>
              {dueToday.map((habit) => (
                <HabitCard key={habit.id} habit={habit} today={today} />
              ))}
            </section>
          ) : (
            <EmptyState
              icon="☀️"
              title="Nothing scheduled today"
              description="Enjoy the day off — your other habits are below."
            />
          )}

          {otherHabits.length > 0 && (
            <section aria-labelledby="not-today" className={styles.section}>
              <h2 id="not-today" className={styles.sectionTitle}>
                Not scheduled today
              </h2>
              {otherHabits.map((habit) => (
                <HabitCard key={habit.id} habit={habit} today={today} />
              ))}
            </section>
          )}
        </div>
      )}

      <HabitFormModal isOpen={form.isOpen} onClose={form.close} />
    </>
  );
}
