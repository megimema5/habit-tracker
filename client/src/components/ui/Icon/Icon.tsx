import type { SVGProps } from 'react';

/**
 * Small inline SVG icon set (stroke icons on a 24×24 grid). Inline SVG means no icon
 * library, no network request, and icons inherit the text colour (currentColor).
 */
const PATHS = {
  check: 'M20 6 9 17l-5-5',
  close: 'M18 6 6 18M6 6l12 12',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
  edit: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4',
  alert: 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18ZM12 8v4.5M12 16h.01',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18ZM12 11v5M12 8h.01',
  chevronLeft: 'm15 18-6-6 6-6',
  chevronRight: 'm9 18 6-6-6-6',
  flame:
    'M12 3c.6 3.2 4.5 5.4 4.5 10a4.5 4.5 0 0 1-9 0c0-2 .8-3.3 2-4.3.1 1.6.8 2.8 2 3.3-.4-3.4-.3-6 .5-9Z',
  skip: 'M6 5l9 7-9 7V5ZM18 5v14',
  today: 'M4 10.5 12 4l8 6.5M6 9v11h12V9M10 20v-5h4v5',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  chart: 'M4 20V11M10 20V5M16 20v-6M3 20h18',
  calendar: 'M4 6h16v15H4zM4 10.5h16M8.5 3.5v4M15.5 3.5v4',
  logout: 'M9.5 20H5V4h4.5M15.5 16.5 20 12l-4.5-4.5M20 12H9.5',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 1 0 0-5.6Z',
  eyeOff:
    'M3.5 3.5l17 17M10.4 5.7A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.7M6.7 6.8C4 8.5 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1M10 10a2.8 2.8 0 0 0 4 4',
  more: 'M12 5.5h.01M12 12h.01M12 18.5h.01',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  /** Text for screen readers. Leave empty for decorative icons next to a visible label. */
  label?: string;
}

export function Icon({ name, size = 20, label, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
