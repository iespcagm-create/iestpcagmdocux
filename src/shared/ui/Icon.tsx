import type { ReactNode } from 'react';

export type IconName =
  | 'home'
  | 'scan'
  | 'documents'
  | 'backup'
  | 'settings'
  | 'camera'
  | 'folder'
  | 'shield'
  | 'arrow-right'
  | 'file'
  | 'spark'
  | 'lock'
  | 'info'
  | 'check';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="m3 10.8 9-7.8 9 7.8" />
      <path d="M5.5 9.5v10h13v-10" />
      <path d="M9.5 19.5v-6h5v6" />
    </>
  ),
  scan: (
    <>
      <path d="M8 3H4a1 1 0 0 0-1 1v4" />
      <path d="M16 3h4a1 1 0 0 1 1 1v4" />
      <path d="M8 21H4a1 1 0 0 1-1-1v-4" />
      <path d="M16 21h4a1 1 0 0 0 1-1v-4" />
      <path d="M7 12h10" />
    </>
  ),
  documents: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  backup: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" />
      <path d="M8 5V3.5A1.5 1.5 0 0 1 9.5 2h5A1.5 1.5 0 0 1 16 3.5V5" />
      <path d="M8 14h8M9.5 10.5H8M12 10.5h-.5M15.5 10.5H16" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h8M16 7h4" />
      <path d="M4 17h4M12 17h8" />
      <circle cx="14" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1l1.2-2h6.6l1.2 2h1A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 20 6v5.5c0 4.5-3.2 7.9-8 9.5-4.8-1.6-8-5-8-9.5V6z" />
      <path d="m8.8 12 2.2 2.2 4.4-4.4" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M4 12h16" />
      <path d="m14 6 6 6-6 6" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8-1.8 5.7-1.8-5.7-5.7-1.8L10.2 9z" />
      <path d="m18.5 16 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  check: (
    <>
      <path d="m5 12.5 4.2 4.2L19 6.8" />
    </>
  ),
};

export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  );
}
