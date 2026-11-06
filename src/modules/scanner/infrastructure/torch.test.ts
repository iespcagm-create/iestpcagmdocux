import { describe, expect, it, vi } from 'vitest';
import { setTorchEnabled, supportsTorch } from './torch';

function fakeTrack(
  capabilities: Record<string, unknown>,
  applyConstraints = vi.fn().mockResolvedValue(undefined),
): MediaStreamTrack {
  return {
    getCapabilities: () => capabilities,
    applyConstraints,
  } as unknown as MediaStreamTrack;
}

describe('flash de la cámara', () => {
  it('detecta un dispositivo sin capacidad torch', () => {
    const track = fakeTrack({ facingMode: ['environment'] });

    expect(supportsTorch(track)).toBe(false);
  });

  it('trata como no disponible un navegador sin getCapabilities', () => {
    expect(
      supportsTorch({} as unknown as MediaStreamTrack),
    ).toBe(false);
  });

  it('detecta la capacidad torch cuando existe', () => {
    expect(supportsTorch(fakeTrack({ torch: true }))).toBe(true);
  });

  it('no aplica restricciones cuando el flash no está disponible', async () => {
    const applyConstraints = vi.fn().mockResolvedValue(undefined);
    const track = fakeTrack({}, applyConstraints);

    await expect(setTorchEnabled(track, true)).resolves.toBe(false);
    expect(applyConstraints).not.toHaveBeenCalled();
  });

  it('enciende y apaga el flash con applyConstraints', async () => {
    const applyConstraints = vi.fn().mockResolvedValue(undefined);
    const track = fakeTrack({ torch: true }, applyConstraints);

    await expect(setTorchEnabled(track, true)).resolves.toBe(true);
    await expect(setTorchEnabled(track, false)).resolves.toBe(true);
    expect(applyConstraints).toHaveBeenNthCalledWith(1, {
      advanced: [{ torch: true }],
    });
    expect(applyConstraints).toHaveBeenNthCalledWith(2, {
      advanced: [{ torch: false }],
    });
  });

  it('devuelve false si el navegador rechaza la restricción', async () => {
    const applyConstraints = vi
      .fn()
      .mockRejectedValue(new Error('not supported'));
    const track = fakeTrack({ torch: true }, applyConstraints);

    await expect(setTorchEnabled(track, true)).resolves.toBe(false);
  });
});
