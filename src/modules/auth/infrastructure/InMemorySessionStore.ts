import type { AppSession, SessionStore } from '../domain/session';

/**
 * Adaptador en memoria para la base visual de la Subfase 1A.
 * La sesión desaparece al recargar y no concede acceso a datos reales.
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

  startPreview = (): AppSession => {
    if (this.current?.kind === 'preview') {
      return this.current;
    }

    const session: AppSession = {
      kind: 'preview',
      label: 'Vista previa de interfaz',
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
