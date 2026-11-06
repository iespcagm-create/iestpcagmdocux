import type { ReactNode } from 'react';
import { SessionStorageSessionStore } from '../modules/auth/infrastructure/SessionStorageSessionStore';
import { SessionProvider } from '../modules/auth/ui/SessionProvider';
import type { SessionStore } from '../modules/auth/domain/session';
import { ScanSessionProvider } from '../modules/scanner/ui/ScanSessionProvider';

const defaultSessionStore = new SessionStorageSessionStore();

interface AppProvidersProps {
  children: ReactNode;
  sessionStore?: SessionStore;
}

export function AppProviders({
  children,
  sessionStore = defaultSessionStore,
}: AppProvidersProps) {
  return (
    <SessionProvider store={sessionStore}>
      <ScanSessionProvider>{children}</ScanSessionProvider>
    </SessionProvider>
  );
}
