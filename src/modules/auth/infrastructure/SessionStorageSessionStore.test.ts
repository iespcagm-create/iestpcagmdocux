import { beforeEach, describe, expect, it } from 'vitest';
import { SessionStorageSessionStore } from './SessionStorageSessionStore';

const SESSION_KEY = 'docux.phase1.session';

describe('SessionStorageSessionStore', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('guarda únicamente la sesión en sessionStorage', () => {
    const store = new SessionStorageSessionStore();
    const session = store.startSession();
    const stored = window.sessionStorage.getItem(SESSION_KEY);

    expect(stored).not.toBeNull();
    expect(JSON.parse(stored ?? '{}')).toEqual(session);
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(stored).not.toContain('123');
  });

  it('restaura la sesión al crear otra instancia', () => {
    const first = new SessionStorageSessionStore();
    const session = first.startSession();
    const second = new SessionStorageSessionStore();

    expect(second.getSnapshot()).toEqual(session);
  });

  it('elimina la sesión al cerrar', () => {
    const store = new SessionStorageSessionStore();
    store.startSession();
    store.clear();

    expect(store.getSnapshot()).toBeNull();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
