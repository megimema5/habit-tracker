import { useNavigate, useSearchParams } from 'react-router-dom';
import { WEEKDAYS } from '@habit/shared';
import { PageHeader } from '../components/layout';
import {
  ColumnChart,
  DataTable,
  HabitCompletionList,
  PeriodFilter,
  StatTile,
  PERIODS,
  type ColumnDatum,
  type Period,
} from '../components/stats';
import { Button, Card, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { useDocumentTitle } from '../hooks/common/useDocumentTitle';
import { useLocalStorage } from '../hooks/common/useLocalStorage';
import { useStats } from '../hooks/stats/useStats';
import { cn } from '../utils/cn';
import { formatDay } from '../utils/dates';
import { formatPercent } from '../utils/format';
import styles from './StatsPage.module.css';

const PERCENT_TICKS = [
  { value: 0, label: '0%' },
  { value: 0.5, label: '50%' },
  { value: 1, label: '100%' },
];

/** Label every day for a week, then roughly every week / two weeks on longer periods. */
function labelEvery(days: number): number {
  return days <= 7 ? 1 : days <= 31 ? 7 : 15;
}

/** Completion rates, the daily trend, per-habit progress and the most-missed weekday. */
export function StatsPage() {
  useDocumentTitle('Stats');
  const navigate = useNavigate();
  // The period lives in the URL (/stats?days=7) so it works with the back button and can be
  // shared, and the last choice is remembered for the next visit via the nav link.
  const [searchParams, setSearchParams] = useSearchParams();
  const [lastPeriod, setLastPeriod] = useLocalStorage<number>('habit-tracker:stats-period', 30);
  const fromUrl = Number(searchParams.get('days'));
  const period: Period =
    PERIODS.find((p) => p === fromUrl) ?? PERIODS.find((p) => p === lastPeriod) ?? 30;
  const setPeriod = (days: Period) => {
    setLastPeriod(days);
    setSearchParams({ days: String(days) }, { replace: true });
  };
  const { data: stats, isPending, isError, isPlaceholderData, refetch } = useStats(period);

  const filter = <PeriodFilter value={period} onChange={setPeriod} />;
  const header = <PageHeader title="Stats" subtitle="How your habits are going over time." />;

  if (isPending) {
    return (
      <>
        {header}
        {filter}
        <div className={styles.loading} aria-busy="true" aria-label="Loading stats">
          <Skeleton height={110} />
          <Skeleton height={280} />
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        {header}
        <ErrorState message="Your stats could not be loaded." onRetry={() => void refetch()} />
      </>
    );
  }

  if (stats.perHabit.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon="📊"
          title="No stats yet"
          description="Create a habit and check it off for a few days — your progress will show up here."
          action={<Button onClick={() => void navigate('/habits')}>Go to habits</Button>}
        />
      </>
    );
  }

  const every = labelEvery(stats.days);
  const trendData: ColumnDatum[] = stats.trend.map((day, index) => ({
    key: day.date,
    value: day.rate,
    axisLabel:
      (stats.days - 1 - index) % every === 0
        ? formatDay(
            day.date,
            stats.days <= 7 ? { weekday: 'short' } : { day: 'numeric', month: 'short' },
          )
        : null,
    title: formatDay(day.date, { weekday: 'short', day: 'numeric', month: 'short' }),
    detail:
      day.target === 0
        ? 'Nothing due'
        : `${day.done} of ${day.target} done · ${formatPercent(day.rate)}`,
  }));

  // Mon → Sun, emphasis on the weekday missed most often.
  const weekdayData: ColumnDatum[] = WEEKDAYS.map(({ value, short, long }) => {
    const misses = stats.missedByWeekday.find((w) => w.weekday === value);
    const rate = misses && misses.due > 0 ? misses.missed / misses.due : null;
    return {
      key: String(value),
      value: rate,
      axisLabel: short,
      title: long,
      detail:
        misses && misses.due > 0
          ? `${misses.missed} of ${misses.due} missed · ${formatPercent(rate)}`
          : 'Nothing due',
    };
  });
  // The hardest weekday(s): every weekday tied with the highest miss rate.
  const worst = stats.mostMissedWeekday;
  const worstMisses = stats.missedByWeekday.find((w) => w.weekday === worst);
  const worstRate =
    worstMisses && worstMisses.due > 0 ? worstMisses.missed / worstMisses.due : null;
  const hardestDays = WEEKDAYS.filter(({ value }) => {
    const m = stats.missedByWeekday.find((w) => w.weekday === value);
    return worstRate !== null && m !== undefined && m.missed > 0 && m.missed / m.due === worstRate;
  });
  const hardestNames = hardestDays.map((d) => `${d.long}s`).join(' and ');
  const maxMissRate = Math.max(...weekdayData.map((d) => d.value ?? 0), 0.25);
  const missMax = Math.ceil(maxMissRate * 4) / 4; // round up to a clean 25% step
  const daysWithHabits = stats.trend.filter((day) => day.target > 0).length;

  return (
    <>
      {header}
      {filter}

      <div
        className={cn(styles.content, isPlaceholderData && styles.refreshing)}
        aria-busy={isPlaceholderData}
      >
        <div className={styles.tiles}>
          <StatTile
            hero
            label="Completion rate"
            value={formatPercent(stats.completionRate)}
            hint={`${stats.done} of ${stats.target} done`}
          />
          <StatTile
            label="Perfect days"
            value={stats.perfectDays}
            hint={`of ${daysWithHabits} days with habits due`}
          />
          <StatTile label="Times done" value={stats.done} hint={`in the last ${stats.days} days`} />
          <StatTile
            label="Most missed day"
            value={
              hardestDays.length === 0
                ? 'None 🎉'
                : hardestDays.length === 1
                  ? (hardestDays[0]?.long ?? '')
                  : hardestDays.map((d) => d.short).join(' & ')
            }
            hint={
              worstRate !== null
                ? `${formatPercent(worstRate)} of due days missed`
                : 'Nothing missed'
            }
          />
        </div>

        <Card padding="lg">
          <h2 className={styles.cardTitle}>Daily completion</h2>
          <p className={styles.cardHint}>
            Share of habits due each day that were done. Skipped days don’t count.
          </p>
          <ColumnChart
            data={trendData}
            max={1}
            ticks={PERCENT_TICKS}
            label={`Daily completion, last ${stats.days} days`}
          />
          <DataTable
            caption="Daily completion"
            columns={['Day', 'Done', 'Due', 'Rate']}
            rows={[...stats.trend]
              .reverse()
              .map((day) => [
                formatDay(day.date, { weekday: 'short', day: 'numeric', month: 'short' }),
                day.done,
                day.target,
                formatPercent(day.rate),
              ])}
          />
        </Card>

        <div className={styles.columns}>
          <Card padding="lg">
            <h2 className={styles.cardTitle}>By habit</h2>
            <p className={styles.cardHint}>Weekly habits count weeks instead of days.</p>
            <HabitCompletionList habits={stats.perHabit} />
          </Card>

          <Card padding="lg">
            <h2 className={styles.cardTitle}>Missed by weekday</h2>
            <p className={styles.cardHint}>
              {hardestDays.length > 0
                ? `${hardestNames} are your hardest ${hardestDays.length > 1 ? 'days' : 'day'} — ${formatPercent(worstRate)} missed.`
                : 'No missed days in this period.'}
            </p>
            <ColumnChart
              data={weekdayData}
              max={missMax}
              ticks={[
                { value: 0, label: '0%' },
                { value: missMax, label: formatPercent(missMax) },
              ]}
              label="Share of due days missed, by weekday"
              highlightKeys={hardestDays.map((d) => String(d.value))}
              highlightLabel={formatPercent(worstRate)}
              height={200}
            />
            <DataTable
              caption="Missed by weekday"
              columns={['Weekday', 'Missed', 'Due', 'Rate']}
              rows={WEEKDAYS.map(({ value, long }) => {
                const m = stats.missedByWeekday.find((w) => w.weekday === value);
                return [
                  long,
                  m?.missed ?? 0,
                  m?.due ?? 0,
                  formatPercent(m && m.due > 0 ? m.missed / m.due : null),
                ];
              })}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
