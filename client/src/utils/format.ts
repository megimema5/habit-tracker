/** 0.914 → "91%"; null → "–". */
export function formatPercent(rate: number | null): string {
  return rate === null ? '–' : `${Math.round(rate * 100)}%`;
}
