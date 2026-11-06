import {
  computeWarpDimensions,
  isConvexQuad,
  orderCorners,
  quadAreaRatio,
  type Point,
  type Quad,
} from '../domain/documentGeometry';
import {
  createCanvas,
  drawSourceToCanvas,
  loadImageSource,
} from './image';
import type { CvMat, OpenCvRuntime } from './opencv';

const MIN_AREA_RATIO = 0.25;
const MAX_AREA_RATIO = 0.98;
const ANALYSIS_MAX_SIDE = 1200;

export interface DetectionResult {
  corners: Quad;
  confidence: number;
  strategy: string;
}

interface Candidate extends DetectionResult {
  areaRatio: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function deleteMat(
  mat: { delete: () => void } | null | undefined,
): void {
  try {
    mat?.delete();
  } catch {
    // OpenCV ya liberó el recurso.
  }
}

function sampleBrightness(gray: CvMat, corners: Quad): number {
  if (gray.cols <= 0 || gray.rows <= 0 || gray.data.length === 0) {
    return 0;
  }

  const [topLeft, topRight, bottomRight, bottomLeft] = corners;
  let total = 0;
  let samples = 0;

  for (let row = 1; row <= 5; row += 1) {
    for (let column = 1; column <= 5; column += 1) {
      const u = column / 6;
      const v = row / 6;
      const x = Math.round(
        (1 - u) * (1 - v) * topLeft.x +
          u * (1 - v) * topRight.x +
          u * v * bottomRight.x +
          (1 - u) * v * bottomLeft.x,
      );
      const y = Math.round(
        (1 - u) * (1 - v) * topLeft.y +
          u * (1 - v) * topRight.y +
          u * v * bottomRight.y +
          (1 - u) * v * bottomLeft.y,
      );

      if (x >= 0 && x < gray.cols && y >= 0 && y < gray.rows) {
        total += gray.data[y * gray.cols + x];
        samples += 1;
      }
    }
  }

  return samples > 0 ? total / samples : 0;
}

function scoreCandidate(
  corners: Quad,
  strategy: string,
  gray: CvMat,
  width: number,
  height: number,
): Candidate | null {
  const areaRatio = quadAreaRatio(corners, width, height);

  if (areaRatio < MIN_AREA_RATIO || areaRatio > MAX_AREA_RATIO) {
    return null;
  }

  const dimensions = computeWarpDimensions(corners, 4000);
  const aspect = dimensions.width / Math.max(1, dimensions.height);

  if (aspect < 0.2 || aspect > 5) {
    return null;
  }

  const brightness = sampleBrightness(gray, corners);
  const brightnessScore = clamp((brightness - 40) / 170, 0, 1);
  const centerX = (corners[0].x + corners[1].x + corners[2].x + corners[3].x) / 4;
  const centerY = (corners[0].y + corners[1].y + corners[2].y + corners[3].y) / 4;
  const centerDistance =
    Math.hypot(centerX - width / 2, centerY - height / 2) /
    Math.max(1, Math.hypot(width, height));
  const centerScore = clamp(1 - centerDistance * 2.2, 0, 1);
  const strategyBonus = strategy.startsWith('canny') ? 0.04 : 0.02;
  const confidence = clamp(
    areaRatio * 0.45 +
      brightnessScore * 0.37 +
      centerScore * 0.12 +
      strategyBonus,
    0,
    1,
  );

  return {
    corners,
    confidence,
    strategy,
    areaRatio,
  };
}

function contourToQuad(
  contour: CvMat,
  cv: OpenCvRuntime,
  width: number,
  height: number,
): Quad | null {
  const perimeter = cv.arcLength(contour, true);

  if (perimeter < 120) {
    return null;
  }

  const approx = new cv.Mat();

  try {
    for (const epsilon of [0.02, 0.03, 0.015, 0.04, 0.05]) {
      cv.approxPolyDP(contour, approx, epsilon * perimeter, true);

      if (approx.rows !== 4 || !cv.isContourConvex(approx)) {
        continue;
      }

      const values = approx.data32S;
      if (values.length < 8) {
        continue;
      }

      const points: Point[] = [];
      for (let index = 0; index < 4; index += 1) {
        points.push({
          x: values[index * 2],
          y: values[index * 2 + 1],
        });
      }

      const ordered = orderCorners(points);

      if (
        isConvexQuad(ordered, 8) &&
        quadAreaRatio(ordered, width, height) >= MIN_AREA_RATIO
      ) {
        return ordered;
      }
    }
  } finally {
    deleteMat(approx);
  }

  return null;
}

function collectCandidates(
  mask: CvMat,
  cv: OpenCvRuntime,
  gray: CvMat,
  width: number,
  height: number,
  strategy: string,
  candidates: Candidate[],
): void {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    cv.findContours(
      mask,
      contours,
      hierarchy,
      cv.RETR_LIST,
      cv.CHAIN_APPROX_SIMPLE,
    );

    const minimumArea = width * height * MIN_AREA_RATIO;
    const maximumArea = width * height * MAX_AREA_RATIO;

    for (let index = 0; index < contours.size(); index += 1) {
      const contour = contours.get(index);

      try {
        const area = cv.contourArea(contour);

        if (area < minimumArea || area > maximumArea) {
          continue;
        }

        const quad = contourToQuad(contour, cv, width, height);

        if (!quad) {
          continue;
        }

        const candidate = scoreCandidate(
          quad,
          strategy,
          gray,
          width,
          height,
        );

        if (candidate) {
          candidates.push(candidate);
        }
      } finally {
        deleteMat(contour);
      }
    }
  } finally {
    deleteMat(contours);
    deleteMat(hierarchy);
  }
}

function collectCannyCandidates(
  blurred: CvMat,
  cv: OpenCvRuntime,
  gray: CvMat,
  width: number,
  height: number,
  candidates: Candidate[],
): void {
  const kernel = cv.getStructuringElement(
    cv.MORPH_RECT,
    new cv.Size(5, 5),
  );
  const smallKernel = cv.getStructuringElement(
    cv.MORPH_RECT,
    new cv.Size(3, 3),
  );

  try {
    for (const [threshold1, threshold2] of [
      [50, 150],
      [30, 90],
    ]) {
      const edges = new cv.Mat();
      const closed = new cv.Mat();
      const dilated = new cv.Mat();

      try {
        cv.Canny(
          blurred,
          edges,
          threshold1,
          threshold2,
          3,
          false,
        );
        cv.morphologyEx(edges, closed, cv.MORPH_CLOSE, kernel);
        cv.dilate(closed, dilated, smallKernel);
        collectCandidates(
          dilated,
          cv,
          gray,
          width,
          height,
          `canny-${threshold1}`,
          candidates,
        );
      } finally {
        deleteMat(edges);
        deleteMat(closed);
        deleteMat(dilated);
      }
    }
  } finally {
    deleteMat(kernel);
    deleteMat(smallKernel);
  }
}

function collectThresholdCandidates(
  blurred: CvMat,
  cv: OpenCvRuntime,
  gray: CvMat,
  width: number,
  height: number,
  candidates: Candidate[],
): void {
  const kernel = cv.getStructuringElement(
    cv.MORPH_RECT,
    new cv.Size(5, 5),
  );

  try {
    const adaptive = new cv.Mat();
    const adaptiveClosed = new cv.Mat();
    const otsu = new cv.Mat();
    const otsuClosed = new cv.Mat();

    try {
      cv.adaptiveThreshold(
        blurred,
        adaptive,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        31,
        10,
      );
      cv.morphologyEx(
        adaptive,
        adaptiveClosed,
        cv.MORPH_CLOSE,
        kernel,
      );
      collectCandidates(
        adaptiveClosed,
        cv,
        gray,
        width,
        height,
        'adaptativo',
        candidates,
      );

      cv.threshold(
        blurred,
        otsu,
        0,
        255,
        cv.THRESH_BINARY + cv.THRESH_OTSU,
      );
      cv.morphologyEx(otsu, otsuClosed, cv.MORPH_CLOSE, kernel);
      collectCandidates(
        otsuClosed,
        cv,
        gray,
        width,
        height,
        'otsu',
        candidates,
      );
    } finally {
      deleteMat(adaptive);
      deleteMat(adaptiveClosed);
      deleteMat(otsu);
      deleteMat(otsuClosed);
    }
  } finally {
    deleteMat(kernel);
  }
}

export function createVideoAnalysisCanvas(
  video: HTMLVideoElement,
  maxSide = 960,
): HTMLCanvasElement | null {
  const width = video.videoWidth;
  const height = video.videoHeight;

  if (!width || !height || video.readyState < 2) {
    return null;
  }

  return drawSourceToCanvas(video, width, height, maxSide);
}

export function detectQuadInCanvas(
  canvas: HTMLCanvasElement,
  cv: OpenCvRuntime,
): DetectionResult | null {
  const width = canvas.width;
  const height = canvas.height;

  if (width < 40 || height < 40) {
    return null;
  }

  const gray = new cv.Mat();
  const blurred = new cv.Mat();

  try {
    const src = cv.imread(canvas);
    try {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    } finally {
      deleteMat(src);
    }
    cv.GaussianBlur(
      gray,
      blurred,
      new cv.Size(5, 5),
      0,
      0,
      cv.BORDER_CONSTANT,
    );

    const candidates: Candidate[] = [];
    collectCannyCandidates(
      blurred,
      cv,
      gray,
      width,
      height,
      candidates,
    );
    collectThresholdCandidates(
      blurred,
      cv,
      gray,
      width,
      height,
      candidates,
    );

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => b.confidence - a.confidence);
    const best = candidates[0];

    return {
      corners: best.corners,
      confidence: best.confidence,
      strategy: best.strategy,
    };
  } finally {
    deleteMat(gray);
    deleteMat(blurred);
  }
}

export async function detectDocumentFromBlob(
  blob: Blob,
  cv: OpenCvRuntime,
  maxSide = ANALYSIS_MAX_SIDE,
): Promise<DetectionResult | null> {
  const loaded = await loadImageSource(blob);

  try {
    const analysis = createCanvas(
      loaded.width *
        Math.min(1, maxSide / Math.max(loaded.width, loaded.height)),
      loaded.height *
        Math.min(1, maxSide / Math.max(loaded.width, loaded.height)),
    );
    const context = analysis.getContext('2d', { willReadFrequently: true });

    if (!context) {
      return null;
    }

    context.drawImage(loaded.source, 0, 0, analysis.width, analysis.height);
    const detected = detectQuadInCanvas(analysis, cv);

    if (!detected) {
      return null;
    }

    const scaleX = loaded.width / analysis.width;
    const scaleY = loaded.height / analysis.height;

    return {
      ...detected,
      corners: [
        { x: detected.corners[0].x * scaleX, y: detected.corners[0].y * scaleY },
        { x: detected.corners[1].x * scaleX, y: detected.corners[1].y * scaleY },
        { x: detected.corners[2].x * scaleX, y: detected.corners[2].y * scaleY },
        { x: detected.corners[3].x * scaleX, y: detected.corners[3].y * scaleY },
      ],
    };
  } finally {
    loaded.close();
  }
}
