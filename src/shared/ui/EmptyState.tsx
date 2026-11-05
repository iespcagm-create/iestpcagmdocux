import { useId } from 'react';
import type { ReactNode } from 'react';
import type { IconName } from './Icon';
import { Icon } from './Icon';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
  children?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  children,
}: EmptyStateProps) {
  const headingId = useId();

  return (
    <section className="empty-state" aria-labelledby={headingId}>
      <div className="empty-state__icon">
        <Icon name={icon} size={28} />
      </div>
      <div className="empty-state__copy">
        <h2 id={headingId}>{title}</h2>
        <p>{description}</p>
      </div>
      {children ? <div className="empty-state__actions">{children}</div> : null}
    </section>
  );
}
