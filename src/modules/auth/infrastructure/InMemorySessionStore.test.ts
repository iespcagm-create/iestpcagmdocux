import { describe, expect, it, vi } from 'vitest';
import { InMemorySessionStore } from './InMemorySessionStore';

describe('InMemorySessionStore', () => {
  it('comienza sin sesión', () => {
    const store = new InMemorySessionStore();

    expect(store.getSnapshot()).toBeNull();
  });

  it('activa una sesión de Fase 1 y notifica a los suscriptores', () => {
    const store = new InMemorySessionStore();
    const listener = vi.fn();

    store.subscribe(listener);
    const session = store.startSession();

    expect(session.kind).toBe('phase1');
    expect(store.getSnapshot()).toEqual(session);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('cierra la sesión y permite cancelar la suscripción', () => {
    const store = new InMemorySessionStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.startSession();
    unsubscribe();
    store.clear();

    expect(store.getSnapshot()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
