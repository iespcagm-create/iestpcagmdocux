import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LOGOUT_MESSAGE,
  WELCOME_MESSAGE,
  speakText,
} from './feedback';

class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  volume = 1;
  pitch = 1;

  constructor(text: string) {
    this.text = text;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mensajes de voz', () => {
  it('cancela la voz anterior antes de hablar y aplica las opciones', () => {
    const cancel = vi.fn();
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { cancel, speak });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);

    speakText(WELCOME_MESSAGE, true, {
      lang: 'es-PE',
      rate: 0.95,
      volume: 1,
    });

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(
      speak.mock.invocationCallOrder[0],
    );

    const utterance = speak.mock.calls[0][0] as FakeUtterance;
    expect(utterance.text).toBe(WELCOME_MESSAGE);
    expect(utterance.lang).toBe('es-PE');
    expect(utterance.rate).toBe(0.95);
    expect(utterance.volume).toBe(1);
  });

  it('no habla cuando los avisos de voz están desactivados', () => {
    const cancel = vi.fn();
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { cancel, speak });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);

    speakText(LOGOUT_MESSAGE, false);

    expect(cancel).not.toHaveBeenCalled();
    expect(speak).not.toHaveBeenCalled();
  });

  it('no bloquea la sesión si el navegador no tiene síntesis de voz', () => {
    expect(() => speakText(WELCOME_MESSAGE, true)).not.toThrow();
  });
});
