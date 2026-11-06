import { PDFDocument } from 'pdf-lib';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 24;

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
    const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
    const availableWidth = A4_WIDTH - MARGIN * 2;
    const availableHeight = A4_HEIGHT - MARGIN * 2;
    const scale = Math.min(
      availableWidth / image.width,
      availableHeight / image.height,
    );
    const width = image.width * scale;
    const height = image.height * scale;

    page.drawImage(image, {
      x: (A4_WIDTH - width) / 2,
      y: (A4_HEIGHT - height) / 2,
      width,
      height,
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

  pdf.setProducer('DOCUX Fase 1');
  pdf.setCreator('DOCUX');
  const bytes = await pdf.save();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);

  return new Blob([copy.buffer as ArrayBuffer], {
    type: 'application/pdf',
  });
}
