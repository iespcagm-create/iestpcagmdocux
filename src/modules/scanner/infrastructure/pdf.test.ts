import { describe, expect, it } from 'vitest';
import { defaultPdfName, generatePdf, sanitizePdfName } from './pdf';

const PNG_1X1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

describe('nombres de PDF', () => {
  it('genera el nombre predeterminado DOCUX_AAAA-MM-DD_HH-mm.pdf', () => {
    const date = new Date(2026, 10, 6, 9, 7);

    expect(defaultPdfName(date)).toBe('DOCUX_2026-11-06_09-07.pdf');
  });

  it('agrega la extensión y reemplaza caracteres inválidos', () => {
    expect(sanitizePdfName('  Acta: reunión / 01  ')).toBe(
      'Acta_ reunión _ 01.pdf',
    );
  });

  it('rechaza nombres vacíos', () => {
    expect(sanitizePdfName('   ')).toBeNull();
    expect(sanitizePdfName('.pdf')).toBeNull();
  });

  it('genera un PDF A4 válido en el navegador', async () => {
    const binary = atob(PNG_1X1);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    const image = new Blob([bytes], { type: 'image/png' });
    const pdf = await generatePdf([image, image]);
    const header = new TextDecoder().decode(
      new Uint8Array(await pdf.arrayBuffer()).slice(0, 5),
    );

    expect(pdf.type).toBe('application/pdf');
    expect(pdf.size).toBeGreaterThan(500);
    expect(header).toBe('%PDF-');
  });
});
