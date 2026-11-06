export interface PhaseOneSession {
  readonly kind: 'phase1';
  readonly label: string;
  readonly startedAt: string;
}

/**
 * Sesión de la Fase 1. Se guarda únicamente en sessionStorage y se pierde al
 * cerrar la pestaña. No representa seguridad de producción.
 */
export type AppSession = PhaseOneSession;

export interface SessionStore {
  getSnapshot(): AppSession | null;
  subscribe(listener: () => void): () => void;
  startSession(): AppSession;
  clear(): void;
}
