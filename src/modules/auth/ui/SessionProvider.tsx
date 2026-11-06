import {
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';
import type { SessionStore } from '../domain/session';
import {
  SessionContext,
  type SessionContextValue,
} from './sessionContext';

interface SessionProviderProps {
  store: SessionStore;
  children: ReactNode;
}

export function SessionProvider({ store, children }: SessionProviderProps) {
  const subscribe = useCallback(
    (listener: () => void) => store.subscribe(listener),
    [store],
  );
  const getSnapshot = useCallback(() => store.getSnapshot(), [store]);

  const session = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const startSession = useCallback(() => {
    store.startSession();
  }, [store]);

  const endSession = useCallback(() => {
    store.clear();
  }, [store]);

  const value = useMemo<SessionContextValue>(
    () => ({ session, startSession, endSession }),
    [endSession, session, startSession],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
