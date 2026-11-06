import type { AppSession, SessionStore } from '../domain/session';

/**
 * Adaptador en memoria para pruebas. La sesión no se persiste.
 */
export class InMemorySessionStore implements SessionStore {
  private current: AppSession | null = null;
  private readonly listeners = new Set<() => void>();

  getSnapshot = (): AppSession | null => this.current;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  startSession = (): AppSession => {
    if (this.current?.kind === 'phase1') {
      return this.current;
    }

    const session: AppSession = {
      kind: 'phase1',
      label: 'Sesión de Fase 1',
      startedAt: new Date().toISOString(),
    };

    this.current = session;
    this.emit();
    return session;
  };

  clear = (): void => {
    if (this.current === null) {
      return;
    }

    this.current = null;
    this.emit();
  };

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
