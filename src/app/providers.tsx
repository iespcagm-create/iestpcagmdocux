import type { ReactNode } from 'react';
import { InMemorySessionStore } from '../modules/auth/infrastructure/InMemorySessionStore';
import { SessionProvider } from '../modules/auth/ui/SessionProvider';
import type { SessionStore } from '../modules/auth/domain/session';

const defaultSessionStore = new InMemorySessionStore();

interface AppProvidersProps {
  children: ReactNode;
  sessionStore?: SessionStore;
}

export function AppProviders({
  children,
  sessionStore = defaultSessionStore,
}: AppProvidersProps) {
  return <SessionProvider store={sessionStore}>{children}</SessionProvider>;
}
