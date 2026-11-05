import { createContext, useContext } from 'react';
import type { AppSession } from '../domain/session';

export interface SessionContextValue {
  session: AppSession | null;
  startPreview: () => void;
  endSession: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);

  if (value === null) {
    throw new Error('useSession debe usarse dentro de SessionProvider.');
  }

  return value;
}
