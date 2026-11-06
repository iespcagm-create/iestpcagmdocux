import {
  computeWarpDimensions,
  type Point,
  type Quad,
} from '../domain/documentGeometry';
import {
  canvasToJpeg,
  createCanvas,
  drawSourceToCanvas,
  loadImageSource,
} from './image';
import type { OpenCvRuntime } from './opencv';

export type Homography = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface WarpOptions {
  cv?: OpenCvRuntime | null;
  maxSide?: number;
  quality?: number;
}

function solveLinearSystem(
  matrix: number[][],
  size: number,
): number[] | null {
  for (let column = 0; column < size; column += 1) {
    let pivot = column;

    for (let row = column + 1; row < size; row += 1) {
      if (
        Math.abs(matrix[row][column]) >
        Math.abs(matrix[pivot][column])
      ) {
        pivot = row;
      }
    }

    if (Math.abs(matrix[pivot][column]) < 1e-9) {
      return null;
    }

    if (pivot !== column) {
      const temporary = matrix[pivot];
      matrix[pivot] = matrix[column];
      matrix[column] = temporary;
    }

    const divisor = matrix[column][column];
    for (let index = column; index <= size; index += 1) {
      matrix[column][index] /= divisor;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === column) {
        continue;
      }

      const factor = matrix[row][column];
      if (factor === 0) {
        continue;
      }

      for (let index = column; index <= size; index += 1) {
        matrix[row][index] -= factor * matrix[column][index];
      }
    }
  }

  return matrix.map((row) => row[size]);
}

/**
 * Homografía que transforma los puntos `from` en los puntos `to`.
 * Se usa para el recorte de respaldo cuando OpenCV no está disponible.
 */
export function computeHomography(
  from: readonly Point[],
  to: readonly Point[],
): Homography | null {
  if (from.length !== 4 || to.length !== 4) {
    return null;
  }

  const matrix: number[][] = [];

  for (let index = 0; index < 4; index += 1) {
    const { x, y } = from[index];
    const { x: u, y: v } = to[index];

    matrix.push([
      x,
      y,
      1,
      0,
      0,
      0,
      -u * x,
      -u * y,
      u,
    ]);
    matrix.push([
      0,
      0,
      0,
      x,
      y,
      1,
      -v * x,
      -v * y,
      v,
    ]);
  }

  const solution = solveLinearSystem(matrix, 8);

  if (!solution) {
    return null;
  }

  return [
    solution[0],
    solution[1],
    solution[2],
    solution[3],
    solution[4],
    solution[5],
    solution[6],
    solution[7],
    1,
  ];
}

export function projectPoint(
  homography: Homography,
  point: Point,
): Point | null {
  const denominator =
    homography[6] * point.x + homography[7] * point.y + homography[8];

  if (Math.abs(denominator) < 1e-9) {
    return null;
  }

  return {
    x:
      (homography[0] * point.x +
        homography[1] * point.y +
        homography[2]) /
      denominator,
    y:
      (homography[3] * point.x +
        homography[4] * point.y +
        homography[5]) /
      denominator,
  };
}

function warpWithHomography(
  source: HTMLCanvasElement,
  corners: Quad,
  width: number,
  height: number,
): HTMLCanvasElement {
  const context = source.getContext('2d', { willReadFrequently: true });
  const output = createCanvas(width, height);
  const outputContext = output.getContext('2d');

  if (!context || !outputContext) {
    throw new Error('El navegador no permite corregir la perspectiva.');
  }

  const sourceImage = context.getImageData(
    0,
    0,
    source.width,
    source.height,
  );
  const sourcePixels = sourceImage.data;
  const outputImage = outputContext.createImageData(width, height);
  const outputPixels = outputImage.data;
  const homography = computeHomography(
    [
      { x: 0, y: 0 },
      { x: width - 1, y: 0 },
      { x: width - 1, y: height - 1 },
      { x: 0, y: height - 1 },
    ],
    corners,
  );

  if (!homography) {
    throw new Error('No se pudo calcular la corrección de perspectiva.');
  }

  const [a, b, c, d, e, f, g, h] = homography;
  const sourceWidth = source.width;
  const sourceHeight = source.height;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const denominator = g * x + h * y + 1;
      const outputIndex = (y * width + x) * 4;
      outputPixels[outputIndex] = 255;
      outputPixels[outputIndex + 1] = 255;
      outputPixels[outputIndex + 2] = 255;
      outputPixels[outputIndex + 3] = 255;

      if (Math.abs(denominator) < 1e-9) {
        continue;
      }

      const sourceX = (a * x + b * y + c) / denominator;
      const sourceY = (d * x + e * y + f) / denominator;

      if (
        sourceX < 0 ||
        sourceY < 0 ||
        sourceX >= sourceWidth - 1 ||
        sourceY >= sourceHeight - 1
      ) {
        continue;
      }

      const x0 = Math.floor(sourceX);
      const y0 = Math.floor(sourceY);
      const x1 = x0 + 1;
      const y1 = y0 + 1;
      const fractionX = sourceX - x0;
      const fractionY = sourceY - y0;
      const index00 = (y0 * sourceWidth + x0) * 4;
      const index10 = (y0 * sourceWidth + x1) * 4;
      const index01 = (y1 * sourceWidth + x0) * 4;
      const index11 = (y1 * sourceWidth + x1) * 4;

      for (let channel = 0; channel < 3; channel += 1) {
        const top =
          sourcePixels[index00 + channel] * (1 - fractionX) +
          sourcePixels[index10 + channel] * fractionX;
        const bottom =
          sourcePixels[index01 + channel] * (1 - fractionX) +
          sourcePixels[index11 + channel] * fractionX;
        outputPixels[outputIndex + channel] = Math.round(
          top * (1 - fractionY) + bottom * fractionY,
        );
      }
    }
  }

  outputContext.putImageData(outputImage, 0, 0);
  return output;
}

function warpWithOpenCv(
  source: HTMLCanvasElement,
  corners: Quad,
  width: number,
  height: number,
  cv: OpenCvRuntime,
): HTMLCanvasElement {
  const src = cv.imread(source);
  const dst = new cv.Mat();
  const sourcePoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    corners[0].x,
    corners[0].y,
    corners[1].x,
    corners[1].y,
    corners[2].x,
    corners[2].y,
    corners[3].x,
    corners[3].y,
  ]);
  const destinationPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    width - 1,
    0,
    width - 1,
    height - 1,
    0,
    height - 1,
  ]);
  const matrix = cv.getPerspectiveTransform(sourcePoints, destinationPoints);

  try {
    cv.warpPerspective(
      src,
      dst,
      matrix,
      new cv.Size(width, height),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar(255, 255, 255, 255),
    );

    const output = createCanvas(width, height);
    cv.imshow(output, dst);
    return output;
  } finally {
    matrix.delete();
    destinationPoints.delete();
    sourcePoints.delete();
    dst.delete();
    src.delete();
  }
}

export async function warpDocumentToCanvas(
  blob: Blob,
  corners: Quad,
  options: WarpOptions = {},
): Promise<HTMLCanvasElement> {
  const maxSide = options.maxSide ?? 2400;
  const loaded = await loadImageSource(blob);

  try {
    const source = drawSourceToCanvas(
      loaded.source,
      loaded.width,
      loaded.height,
      Math.max(1600, maxSide),
    );
    const scaleX = source.width / loaded.width;
    const scaleY = source.height / loaded.height;
    const scaledCorners: Quad = [
      { x: corners[0].x * scaleX, y: corners[0].y * scaleY },
      { x: corners[1].x * scaleX, y: corners[1].y * scaleY },
      { x: corners[2].x * scaleX, y: corners[2].y * scaleY },
      { x: corners[3].x * scaleX, y: corners[3].y * scaleY },
    ];
    const fallbackLimit = options.cv ? maxSide : Math.min(maxSide, 1800);
    const dimensions = computeWarpDimensions(
      scaledCorners,
      fallbackLimit,
    );

    if (options.cv) {
      try {
        return warpWithOpenCv(
          source,
          scaledCorners,
          dimensions.width,
          dimensions.height,
          options.cv,
        );
      } catch {
        // Si OpenCV falla (por ejemplo, por falta de memoria), se usa
        // la transformación equivalente en JavaScript.
      }
    }

    return warpWithHomography(
      source,
      scaledCorners,
      dimensions.width,
      dimensions.height,
    );
  } finally {
    loaded.close();
  }
}

export async function warpDocumentToBlob(
  blob: Blob,
  corners: Quad,
  options: WarpOptions = {},
): Promise<Blob> {
  const canvas = await warpDocumentToCanvas(blob, corners, options);
  return canvasToJpeg(canvas, options.quality ?? 0.92);
}
