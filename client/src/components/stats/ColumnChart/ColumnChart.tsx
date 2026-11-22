import { useId, useState, type KeyboardEvent } from 'react';
import { useElementWidth } from '../../../hooks/common/useElementWidth';
import { cn } from '../../../utils/cn';
import styles from './ColumnChart.module.css';

export interface ColumnDatum {
  key: string;
  /** Value between 0 and `max`; null = nothing to show (e.g. nothing was due). */
  value: number | null;
  /** Shown under the column — return null to leave a column unlabelled. */
  axisLabel: string | null;
  /** Tooltip / screen-reader text, e.g. "Mon 17 Nov". */
  title: string;
  /** Tooltip value, e.g. "3 of 4 done · 75%". */
  detail: string;
}

interface ColumnChartProps {
  data: ColumnDatum[];
  max: number;
  /** Labels for the horizontal gridlines, e.g. ['0%', '50%', '100%'] at 0, max/2, max. */
  ticks: { value: number; label: string }[];
  /** Accessible name for the whole chart. */
  label: string;
  /** Emphasis form: these columns in the accent colour, every other column muted. */
  highlightKeys?: string[] | undefined;
  /** Value printed on top of the highlighted columns (selective labelling). */
  highlightLabel?: string | undefined;
  height?: number;
}

const PAD = { top: 24, right: 8, bottom: 28, left: 40 };
const MAX_BAR = 24;
const RADIUS = 4;

/** A column with a 4px rounded top and a square base. */
function columnPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(RADIUS, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/**
 * Accessible SVG column chart, hand-built (no chart library for two small charts).
 * - Thin columns (≤ 24px), rounded tops, hairline gridlines, recessive axis text.
 * - Hover or focus a column → tooltip with its date and value.
 * - Keyboard: the chart is ONE tab stop; ←/→ (Home/End) move between columns and the
 *   current value is announced to screen readers.
 * - Every value is also in a table view (rendered by the parent), so nothing is hover-only.
 */
export function ColumnChart({
  data,
  max,
  ticks,
  label,
  highlightKeys,
  highlightLabel,
  height = 220,
}: ColumnChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const descriptionId = useId();

  const plotWidth = Math.max(width - PAD.left - PAD.right, 0);
  const plotHeight = height - PAD.top - PAD.bottom;
  const band = data.length > 0 ? plotWidth / data.length : 0;
  // Columns take ~60% of their slot (max 24px) so the chart breathes instead of
  // turning into one solid block; the rest is air between columns.
  const barWidth = Math.max(Math.min(MAX_BAR, band * 0.6), 1);
  const y = (value: number) => PAD.top + plotHeight - (Math.min(value, max) / max) * plotHeight;
  const emphasis = highlightKeys !== undefined;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = data.length - 1;
    const current = active ?? last;
    const next =
      event.key === 'ArrowRight'
        ? Math.min(current + 1, last)
        : event.key === 'ArrowLeft'
          ? Math.max(current - 1, 0)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
  }

  const activeDatum = active !== null ? data[active] : undefined;
  const tooltipX = active !== null ? PAD.left + band * active + band / 2 : 0;
  const tooltipY = activeDatum ? y(activeDatum.value ?? 0) : 0;

  return (
    <div
      ref={ref}
      className={styles.chart}
      tabIndex={0}
      role="group"
      aria-label={label}
      aria-describedby={descriptionId}
      onKeyDown={handleKeyDown}
      onFocus={() => setActive((current) => current ?? data.length - 1)}
      onBlur={() => setActive(null)}
      onPointerLeave={() => setActive(null)}
    >
      <p id={descriptionId} className="visually-hidden">
        Use the left and right arrow keys to read each value.
      </p>
      <p className="visually-hidden" aria-live="polite">
        {activeDatum ? `${activeDatum.title}: ${activeDatum.detail}` : ''}
      </p>

      {width > 0 && (
        <svg width={width} height={height} aria-hidden="true" className={styles.svg}>
          {ticks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick.value)}
                y2={y(tick.value)}
                className={styles.grid}
              />
              <text x={PAD.left - 8} y={y(tick.value)} className={styles.tick} dy="0.32em">
                {tick.label}
              </text>
            </g>
          ))}

          {data.map((datum, index) => {
            const x = PAD.left + band * index + (band - barWidth) / 2;
            const isHighlighted = highlightKeys?.includes(datum.key) ?? false;
            const isActive = index === active;
            const barClass = cn(
              styles.bar,
              emphasis && !isHighlighted && styles.muted,
              isActive && styles.active,
            );
            return (
              <g key={datum.key}>
                {datum.value !== null && datum.value > 0 && (
                  <path
                    d={columnPath(x, y(datum.value), barWidth, y(0) - y(datum.value))}
                    className={barClass}
                  />
                )}
                {/* A zero is a real value (due, nothing done): show a 2px stub on the baseline. */}
                {datum.value === 0 && (
                  <rect x={x} y={y(0) - 2} width={barWidth} height={2} className={barClass} />
                )}
                {isHighlighted && highlightLabel && datum.value !== null && (
                  <text x={x + barWidth / 2} y={y(datum.value) - 6} className={styles.capLabel}>
                    {highlightLabel}
                  </text>
                )}
                {datum.axisLabel && (
                  <text
                    x={PAD.left + band * index + band / 2}
                    y={height - 8}
                    className={styles.axisLabel}
                  >
                    {datum.axisLabel}
                  </text>
                )}
                {/* Hit target: the whole band, taller and wider than the column itself. */}
                <rect
                  x={PAD.left + band * index}
                  y={PAD.top}
                  width={band}
                  height={plotHeight}
                  className={styles.hit}
                  onPointerEnter={() => setActive(index)}
                />
              </g>
            );
          })}

          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={y(0)}
            y2={y(0)}
            className={styles.baseline}
          />
        </svg>
      )}

      {activeDatum && (
        <div
          className={styles.tooltip}
          style={{
            left: Math.min(Math.max(tooltipX, 70), Math.max(width - 70, 70)),
            top: tooltipY,
          }}
          aria-hidden="true"
        >
          <strong className={styles.tooltipValue}>{activeDatum.detail}</strong>
          <span className={styles.tooltipLabel}>{activeDatum.title}</span>
        </div>
      )}
    </div>
  );
}
