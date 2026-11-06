import { PDFDocument } from 'pdf-lib';
import { fitImageToA4 } from '../domain/documentGeometry';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function defaultPdfName(date = new Date()): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}-${pad(date.getMinutes())}`;
  return `DOCUX_${day}_${time}.pdf`;
}

function removeControlCharacters(value: string): string {
  return Array.from(value)
    .filter((character) => character.charCodeAt(0) >= 32)
    .join('');
}

export function sanitizePdfName(input: string): string | null {
  const base = removeControlCharacters(input.trim())
    .replace(/\.pdf$/i, '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .slice(0, 90)
    .trim();

  if (!base || base === '.' || base === '..') {
    return null;
  }

  return `${base}.pdf`;
}

export async function generatePdf(
  pageBlobs: Blob[],
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  if (pageBlobs.length === 0) {
    throw new Error('Agregue al menos una página antes de generar el PDF.');
  }

  const pdf = await PDFDocument.create();

  for (let index = 0; index < pageBlobs.length; index += 1) {
    const blob = pageBlobs[index];
    const bytes = await blob.arrayBuffer();
    const image = blob.type.includes('png')
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(bytes);
    const layout = fitImageToA4(image.width, image.height);
    const page = pdf.addPage([layout.pageWidth, layout.pageHeight]);

    page.drawImage(image, {
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
    });

    onProgress?.(
      Math.round(((index + 1) / pageBlobs.length) * 100),
    );

    await new Promise<void>((resolve) => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => resolve());
      } else {
        window.setTimeout(resolve, 0);
      }
    });
  }

  pdf.setProducer('DOCUX');
  pdf.setCreator('DOCUX');
  const bytes = await pdf.save();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);

  return new Blob([copy.buffer as ArrayBuffer], {
    type: 'application/pdf',
  });
}
