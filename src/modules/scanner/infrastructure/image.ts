export interface LoadedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

function loadImageElement(blob: Blob): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => URL.revokeObjectURL(url),
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen capturada.'));
    };
    image.src = url;
  });
}

export async function loadImageSource(blob: Blob): Promise<LoadedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Safari antiguo o imágenes no compatibles: se usa <img>.
    }
  }

  return loadImageElement(blob);
}

export function createCanvas(
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export function drawSourceToCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  maxSide?: number,
): HTMLCanvasElement {
  const scale =
    maxSide && Math.max(sourceWidth, sourceHeight) > maxSide
      ? maxSide / Math.max(sourceWidth, sourceHeight)
      : 1;
  const canvas = createCanvas(sourceWidth * scale, sourceHeight * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('El navegador no permite procesar la imagen.');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('No se pudo preparar la imagen de la página.'));
        }
      },
      'image/jpeg',
      quality,
    );
  });
}

export async function getImageDimensions(
  blob: Blob,
): Promise<ImageDimensions> {
  const loaded = await loadImageSource(blob);

  try {
    return { width: loaded.width, height: loaded.height };
  } finally {
    loaded.close();
  }
}

export function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      window.setTimeout(resolve, 0);
    }
  });
}
