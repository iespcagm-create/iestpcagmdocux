export interface PreviewSession {
  readonly kind: 'preview';
  readonly label: string;
  readonly startedAt: string;
}

/**
 * Sesión efímera de la Subfase 1A. No representa una autenticación real.
 * En la Subfase 1B se sustituirá por la sesión local verificada.
 */
export type AppSession = PreviewSession;

export interface SessionStore {
  getSnapshot(): AppSession | null;
  subscribe(listener: () => void): () => void;
  startPreview(): AppSession;
  clear(): void;
}
