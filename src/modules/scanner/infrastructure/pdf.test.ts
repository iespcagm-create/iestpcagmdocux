import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  A4_LANDSCAPE,
  A4_PORTRAIT,
} from '../domain/documentGeometry';
import { defaultPdfName, generatePdf, sanitizePdfName } from './pdf';

const PNG_1X1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const PNG_2X1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAIAAAB7QOjdAAAAC0lEQVR4nGP4DwUAI+UH+Yo0eLMAAAAASUVORK5CYII=';

function pngBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  );
  return new Blob([bytes], { type: 'image/png' });
}

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
    const image = pngBlob(PNG_1X1);
    const pdf = await generatePdf([image, image]);
    const bytes = new Uint8Array(await pdf.arrayBuffer());
    const header = new TextDecoder().decode(bytes.slice(0, 5));
    const document = await PDFDocument.load(bytes);
    const [firstPage] = document.getPages();

    expect(pdf.type).toBe('application/pdf');
    expect(pdf.size).toBeGreaterThan(500);
    expect(header).toBe('%PDF-');
    expect(firstPage.getWidth()).toBeCloseTo(A4_PORTRAIT.width, 2);
    expect(firstPage.getHeight()).toBeCloseTo(A4_PORTRAIT.height, 2);
  });

  it('usa A4 horizontal para una imagen apaisada', async () => {
    const pdf = await generatePdf([pngBlob(PNG_2X1)]);
    const bytes = new Uint8Array(await pdf.arrayBuffer());
    const document = await PDFDocument.load(bytes);
    const [firstPage] = document.getPages();

    expect(firstPage.getWidth()).toBeCloseTo(A4_LANDSCAPE.width, 2);
    expect(firstPage.getHeight()).toBeCloseTo(A4_LANDSCAPE.height, 2);
  });
});
