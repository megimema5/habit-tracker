import styles from './DataTable.module.css';

interface DataTableProps {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}

/** "Show as table" — every chart value without needing hover (and for screen readers). */
export function DataTable({ caption, columns, rows }: DataTableProps) {
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>Show as table</summary>
      <div className={styles.scroll} tabIndex={0} role="region" aria-label={caption}>
        <table className={styles.table}>
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row[0])}>
                {row.map((cell, index) =>
                  index === 0 ? (
                    <th key={index} scope="row">
                      {cell}
                    </th>
                  ) : (
                    <td key={index}>{cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
