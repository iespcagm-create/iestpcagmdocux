export interface Point {
  x: number;
  y: number;
}

export type Quad = [Point, Point, Point, Point];

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

export type A4Orientation = 'portrait' | 'landscape';

export interface A4Layout {
  pageWidth: number;
  pageHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: A4Orientation;
  margin: number;
}

export const MM_TO_PT = 72 / 25.4;
export const A4_PORTRAIT: Size = {
  width: 210 * MM_TO_PT,
  height: 297 * MM_TO_PT,
};
export const A4_LANDSCAPE: Size = {
  width: A4_PORTRAIT.height,
  height: A4_PORTRAIT.width,
};
export const PDF_MARGIN_MM = 6;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function signedArea(corners: readonly Point[]): number {
  let total = 0;

  for (let index = 0; index < corners.length; index += 1) {
    const current = corners[index];
    const next = corners[(index + 1) % corners.length];
    total += current.x * next.y - next.x * current.y;
  }

  return total / 2;
}

export function signedQuadArea(corners: readonly Point[]): number {
  return signedArea(corners);
}

export function quadArea(corners: readonly Point[]): number {
  return Math.abs(signedArea(corners));
}

export function quadAreaRatio(
  corners: readonly Point[],
  imageWidth: number,
  imageHeight: number,
): number {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return 0;
  }

  return quadArea(corners) / (imageWidth * imageHeight);
}

/**
 * Devuelve las esquinas en orden superior izquierda, superior derecha,
 * inferior derecha e inferior izquierda. Para documentos vistos desde la
 * cámara, las dos esquinas con menor Y forman el borde superior.
 */
export function orderCorners(points: readonly Point[]): Quad {
  if (points.length !== 4) {
    throw new Error('Se necesitan exactamente cuatro esquinas.');
  }

  const sortedByY = [...points].sort(
    (a, b) => a.y - b.y || a.x - b.x,
  );
  const top = sortedByY.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottom = sortedByY.slice(2, 4).sort((a, b) => a.x - b.x);
  const ordered: Quad = [top[0], top[1], bottom[1], bottom[0]];

  if (signedArea(ordered) < 0) {
    return [ordered[0], ordered[3], ordered[2], ordered[1]];
  }

  return ordered;
}

export function isConvexQuad(
  corners: readonly Point[],
  minimumEdge = 1,
): boolean {
  if (corners.length !== 4) {
    return false;
  }

  let direction = 0;

  for (let index = 0; index < 4; index += 1) {
    const a = corners[index];
    const b = corners[(index + 1) % 4];
    const c = corners[(index + 2) % 4];

    if (
      distance(a, b) < minimumEdge ||
      distance(b, c) < minimumEdge
    ) {
      return false;
    }

    const cross =
      (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);

    if (Math.abs(cross) < 0.0001) {
      return false;
    }

    const sign = Math.sign(cross);
    if (direction === 0) {
      direction = sign;
    } else if (sign !== direction) {
      return false;
    }
  }

  return quadArea(corners) > 0.5;
}

export function clampPointToImage(
  point: Point,
  imageWidth: number,
  imageHeight: number,
): Point {
  return {
    x: clamp(point.x, 0, Math.max(0, imageWidth - 1)),
    y: clamp(point.y, 0, Math.max(0, imageHeight - 1)),
  };
}

export function clampQuadToImage(
  corners: readonly Point[],
  imageWidth: number,
  imageHeight: number,
): Quad {
  return [
    clampPointToImage(corners[0], imageWidth, imageHeight),
    clampPointToImage(corners[1], imageWidth, imageHeight),
    clampPointToImage(corners[2], imageWidth, imageHeight),
    clampPointToImage(corners[3], imageWidth, imageHeight),
  ];
}

export function fallbackQuad(
  imageWidth: number,
  imageHeight: number,
  marginRatio = 0.05,
): Quad {
  const width = Math.max(2, imageWidth);
  const height = Math.max(2, imageHeight);
  const marginX = width * marginRatio;
  const marginY = height * marginRatio;
  const right = Math.max(marginX + 1, width - 1 - marginX);
  const bottom = Math.max(marginY + 1, height - 1 - marginY);

  return [
    { x: marginX, y: marginY },
    { x: right, y: marginY },
    { x: right, y: bottom },
    { x: marginX, y: bottom },
  ];
}

export function createInitialQuad(
  detected: readonly Point[] | null | undefined,
  imageWidth: number,
  imageHeight: number,
): Quad {
  if (detected && detected.length === 4) {
    const ordered = orderCorners(detected);

    if (
      isConvexQuad(ordered) &&
      quadAreaRatio(ordered, imageWidth, imageHeight) >= 0.05
    ) {
      return clampQuadToImage(ordered, imageWidth, imageHeight);
    }
  }

  return fallbackQuad(imageWidth, imageHeight);
}

export function scaleQuad(
  corners: readonly Point[],
  scaleX: number,
  scaleY: number,
): Quad {
  return [
    { x: corners[0].x * scaleX, y: corners[0].y * scaleY },
    { x: corners[1].x * scaleX, y: corners[1].y * scaleY },
    { x: corners[2].x * scaleX, y: corners[2].y * scaleY },
    { x: corners[3].x * scaleX, y: corners[3].y * scaleY },
  ];
}

export function maxCornerDistance(
  a: readonly Point[],
  b: readonly Point[],
): number {
  let maximum = 0;

  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    maximum = Math.max(maximum, distance(a[index], b[index]));
  }

  return maximum;
}

export interface WarpDimensions extends Size {
  scale: number;
}

export function computeWarpDimensions(
  corners: readonly Point[],
  maxSide = 2400,
): WarpDimensions {
  const [topLeft, topRight, bottomRight, bottomLeft] = corners;
  const top = distance(topLeft, topRight);
  const bottom = distance(bottomLeft, bottomRight);
  const left = distance(topLeft, bottomLeft);
  const right = distance(topRight, bottomRight);
  const naturalWidth = Math.max(1, Math.round(Math.max(top, bottom)));
  const naturalHeight = Math.max(1, Math.round(Math.max(left, right)));
  const limit = Math.max(200, maxSide);
  const scale = Math.min(
    1,
    limit / Math.max(naturalWidth, naturalHeight),
  );

  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
    scale,
  };
}

export function displayedImageRect(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): Rect {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const scale = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight,
  );
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height,
  };
}

export function screenPointToImage(
  clientX: number,
  clientY: number,
  containerRect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  imageWidth: number,
  imageHeight: number,
): Point {
  const display = displayedImageRect(
    containerRect.width,
    containerRect.height,
    imageWidth,
    imageHeight,
  );

  if (display.width <= 0 || display.height <= 0) {
    return { x: 0, y: 0 };
  }

  return clampPointToImage(
    {
      x:
        ((clientX - containerRect.left - display.x) / display.width) *
        imageWidth,
      y:
        ((clientY - containerRect.top - display.y) / display.height) *
        imageHeight,
    },
    imageWidth,
    imageHeight,
  );
}

export function imagePointToDisplay(
  point: Point,
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): Point {
  const display = displayedImageRect(
    containerWidth,
    containerHeight,
    imageWidth,
    imageHeight,
  );

  return {
    x: display.x + (point.x / imageWidth) * display.width,
    y: display.y + (point.y / imageHeight) * display.height,
  };
}

export function fitImageToA4(
  imageWidth: number,
  imageHeight: number,
  marginMm = PDF_MARGIN_MM,
): A4Layout {
  if (imageWidth <= 0 || imageHeight <= 0) {
    throw new Error('La imagen no tiene dimensiones válidas.');
  }

  const orientation: A4Orientation =
    imageHeight >= imageWidth ? 'portrait' : 'landscape';
  const page =
    orientation === 'portrait' ? A4_PORTRAIT : A4_LANDSCAPE;
  const margin = Math.max(0, marginMm) * MM_TO_PT;
  const availableWidth = Math.max(1, page.width - margin * 2);
  const availableHeight = Math.max(1, page.height - margin * 2);
  const scale = Math.min(
    availableWidth / imageWidth,
    availableHeight / imageHeight,
  );
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    pageWidth: page.width,
    pageHeight: page.height,
    x: (page.width - width) / 2,
    y: (page.height - height) / 2,
    width,
    height,
    orientation,
    margin,
  };
}
