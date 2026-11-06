import type { Quad } from '../domain/documentGeometry';
import { canvasToJpeg } from './image';
import type { OpenCvRuntime } from './opencv';
import { warpDocumentToCanvas } from './perspective';

export type PageFilter = 'original' | 'document' | 'blackWhite';

export const PAGE_FILTERS: Array<{ id: PageFilter; label: string }> = [
  { id: 'original', label: 'Original' },
  { id: 'document', label: 'Documento' },
  { id: 'blackWhite', label: 'Blanco y negro' },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function percentile(
  histogram: Uint32Array,
  total: number,
  ratio: number,
): number {
  const target = total * ratio;
  let accumulated = 0;

  for (let index = 0; index < histogram.length; index += 1) {
    accumulated += histogram[index];
    if (accumulated >= target) {
      return index;
    }
  }

  return histogram.length - 1;
}

function applyDocumentFilter(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return;
  }

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  const totalPixels = canvas.width * canvas.height;
  const step = Math.max(1, Math.floor(totalPixels / 250000));
  const histogram = new Uint32Array(256);
  let samples = 0;

  for (let index = 0; index < totalPixels; index += step) {
    const offset = index * 4;
    const luminance =
      pixels[offset] * 0.299 +
      pixels[offset + 1] * 0.587 +
      pixels[offset + 2] * 0.114;
    histogram[Math.round(luminance)] += 1;
    samples += 1;
  }

  const low = percentile(histogram, samples, 0.015);
  const high = percentile(histogram, samples, 0.985);
  const black = Math.min(low, 150);
  const white = Math.max(high, black + 40, 180);
  const span = white - black;

  for (let offset = 0; offset < pixels.length; offset += 4) {
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
    const normalized = clamp((luminance - black) / span, 0, 1);
    const smooth = normalized * normalized * (3 - 2 * normalized);
    let target = 255 * smooth;

    if (normalized > 0.94 && luminance > 185) {
      target = 255;
    }

    const mixed = target * 0.86 + luminance * 0.14;
    const gain = clamp(mixed / Math.max(6, luminance), 0.55, 1.75);

    pixels[offset] = clamp(Math.round(red * gain), 0, 255);
    pixels[offset + 1] = clamp(Math.round(green * gain), 0, 255);
    pixels[offset + 2] = clamp(Math.round(blue * gain), 0, 255);
    pixels[offset + 3] = 255;
  }

  context.putImageData(image, 0, 0);
}

function applyBlackAndWhiteWithOpenCv(
  canvas: HTMLCanvasElement,
  cv: OpenCvRuntime,
): void {
  const src = cv.imread(canvas);
  const gray = new cv.Mat();
  const binary = new cv.Mat();
  const rgba = new cv.Mat();

  try {
    const naturalBlock = Math.round(
      Math.min(canvas.width, canvas.height) / 60,
    );
    const oddBlock =
      naturalBlock % 2 === 0 ? naturalBlock + 1 : naturalBlock;
    const blockSize = Math.max(21, Math.min(61, oddBlock));

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.adaptiveThreshold(
      gray,
      binary,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      blockSize,
      12,
    );
    cv.cvtColor(binary, rgba, cv.COLOR_GRAY2RGBA);
    cv.imshow(canvas, rgba);
  } finally {
    rgba.delete();
    binary.delete();
    gray.delete();
    src.delete();
  }
}

function applyBlackAndWhiteWithCanvas(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return;
  }

  const width = canvas.width;
  const height = canvas.height;
  const image = context.getImageData(0, 0, width, height);
  const pixels = image.data;
  const gray = new Uint8Array(width * height);

  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4;
    gray[index] = Math.round(
      pixels[offset] * 0.299 +
        pixels[offset + 1] * 0.587 +
        pixels[offset + 2] * 0.114,
    );
  }

  const integral = new Uint32Array((width + 1) * (height + 1));
  const stride = width + 1;

  for (let y = 1; y <= height; y += 1) {
    let rowSum = 0;
    for (let x = 1; x <= width; x += 1) {
      rowSum += gray[(y - 1) * width + (x - 1)];
      integral[y * stride + x] =
        integral[(y - 1) * stride + x] + rowSum;
    }
  }

  const naturalBlock = Math.round(Math.min(width, height) / 60);
  const radius = Math.max(
    10,
    Math.min(30, Math.floor(naturalBlock / 2)),
  );

  for (let y = 0; y < height; y += 1) {
    const top = Math.max(0, y - radius);
    const bottom = Math.min(height - 1, y + radius);

    for (let x = 0; x < width; x += 1) {
      const left = Math.max(0, x - radius);
      const right = Math.min(width - 1, x + radius);
      const area =
        (right - left + 1) * (bottom - top + 1);
      const sum =
        integral[(bottom + 1) * stride + (right + 1)] -
        integral[top * stride + (right + 1)] -
        integral[(bottom + 1) * stride + left] +
        integral[top * stride + left];
      const mean = sum / area;
      const value = gray[y * width + x] > mean - 12 ? 255 : 0;
      const offset = (y * width + x) * 4;
      pixels[offset] = value;
      pixels[offset + 1] = value;
      pixels[offset + 2] = value;
      pixels[offset + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
}

export function applyFilterToCanvas(
  canvas: HTMLCanvasElement,
  filter: PageFilter,
  cv?: OpenCvRuntime | null,
): void {
  if (filter === 'document') {
    applyDocumentFilter(canvas);
    return;
  }

  if (filter === 'blackWhite') {
    if (cv) {
      try {
        applyBlackAndWhiteWithOpenCv(canvas, cv);
        return;
      } catch {
        // Se usa la umbralización adaptativa equivalente del canvas.
      }
    }

    applyBlackAndWhiteWithCanvas(canvas);
  }
}

export interface ProcessPageOptions {
  filter: PageFilter;
  cv?: OpenCvRuntime | null;
  maxSide?: number;
  quality?: number;
}

export async function processPageImage(
  blob: Blob,
  corners: Quad,
  options: ProcessPageOptions,
): Promise<Blob> {
  const canvas = await warpDocumentToCanvas(blob, corners, {
    cv: options.cv,
    maxSide: options.maxSide,
  });
  applyFilterToCanvas(canvas, options.filter, options.cv);
  return canvasToJpeg(canvas, options.quality ?? 0.92);
}
