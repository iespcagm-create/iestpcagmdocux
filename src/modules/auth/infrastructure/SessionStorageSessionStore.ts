import type { AppSession, SessionStore } from '../domain/session';

const SESSION_KEY = 'docux.phase1.session';

function readStoredSession(): AppSession | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AppSession>;
    if (parsed.kind !== 'phase1' || typeof parsed.startedAt !== 'string') {
      return null;
    }

    return {
      kind: 'phase1',
      label: 'Sesión de Fase 1',
      startedAt: parsed.startedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Sesión provisional de Fase 1 en sessionStorage.
 * No se guarda la contraseña. No usar como seguridad de producción.
 */
export class SessionStorageSessionStore implements SessionStore {
  private current: AppSession | null = readStoredSession();
  private readonly listeners = new Set<() => void>();

  getSnapshot = (): AppSession | null => this.current;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  startSession = (): AppSession => {
    if (this.current !== null) {
      return this.current;
    }

    const session: AppSession = {
      kind: 'phase1',
      label: 'Sesión de Fase 1',
      startedAt: new Date().toISOString(),
    };

    this.current = session;

    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Si el navegador bloquea sessionStorage, la sesión sigue en memoria.
    }

    this.emit();
    return session;
  };

  clear = (): void => {
    if (this.current === null) {
      return;
    }

    this.current = null;

    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Sin sessionStorage no hay nada persistido que eliminar.
    }

    this.emit();
  };

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
