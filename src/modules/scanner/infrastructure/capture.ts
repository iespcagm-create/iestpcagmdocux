export interface SourceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getSourceRect(
  video: HTMLVideoElement,
  guide: HTMLElement | null,
): SourceRect | null {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  if (!videoWidth || !videoHeight) {
    return null;
  }

  if (!guide) {
    return { x: 0, y: 0, width: videoWidth, height: videoHeight };
  }

  const videoRect = video.getBoundingClientRect();
  const guideRect = guide.getBoundingClientRect();
  const scale = Math.max(
    videoRect.width / videoWidth,
    videoRect.height / videoHeight,
  );
  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;
  const offsetX = (videoRect.width - renderedWidth) / 2;
  const offsetY = (videoRect.height - renderedHeight) / 2;

  let x = (guideRect.left - videoRect.left - offsetX) / scale;
  let y = (guideRect.top - videoRect.top - offsetY) / scale;
  let width = guideRect.width / scale;
  let height = guideRect.height / scale;

  x = Math.max(0, Math.min(x, videoWidth - 1));
  y = Math.max(0, Math.min(y, videoHeight - 1));
  width = Math.max(1, Math.min(width, videoWidth - x));
  height = Math.max(1, Math.min(height, videoHeight - y));

  return { x, y, width, height };
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('No se pudo convertir la captura.'));
        }
      },
      'image/jpeg',
      0.9,
    );
  });
}

export async function captureVideoFrame(
  video: HTMLVideoElement,
  guide: HTMLElement | null,
): Promise<Blob> {
  const source = getSourceRect(video, guide);

  if (!source) {
    throw new Error('La cámara todavía no tiene imagen.');
  }

  const maxSide = 1800;
  const reduction = Math.min(1, maxSide / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * reduction));
  canvas.height = Math.max(1, Math.round(source.height * reduction));

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('El navegador no permite procesar la captura.');
  }

  context.drawImage(
    video,
    source.x,
    source.y,
    source.width,
    source.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvasToJpeg(canvas);
}

export function getFrameSignature(
  video: HTMLVideoElement,
  guide: HTMLElement | null,
): Uint8ClampedArray | null {
  const source = getSourceRect(video, guide);

  if (!source || video.readyState < 2) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 36;
  canvas.height = 44;
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    return null;
  }

  context.drawImage(
    video,
    source.x,
    source.y,
    source.width,
    source.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const signature = new Uint8ClampedArray(canvas.width * canvas.height);

  for (let index = 0; index < signature.length; index += 1) {
    const offset = index * 4;
    signature[index] = Math.round(
      pixels[offset] * 0.299 +
        pixels[offset + 1] * 0.587 +
        pixels[offset + 2] * 0.114,
    );
  }

  return signature;
}

export function meanAbsoluteDifference(
  previous: Uint8ClampedArray,
  current: Uint8ClampedArray,
): number {
  const length = Math.min(previous.length, current.length);
  let total = 0;

  for (let index = 0; index < length; index += 1) {
    total += Math.abs(previous[index] - current[index]);
  }

  return total / Math.max(1, length);
}

export async function rotateImageBlob(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.height;
  canvas.height = bitmap.width;

  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('El navegador no permite girar la imagen.');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(Math.PI / 2);
  context.drawImage(
    bitmap,
    -bitmap.width / 2,
    -bitmap.height / 2,
    bitmap.width,
    bitmap.height,
  );
  bitmap.close();

  return canvasToJpeg(canvas);
}
