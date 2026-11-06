export interface CvSize {
  width: number;
  height: number;
}

export interface CvScalar {
  delete?: () => void;
}

export interface CvMat {
  rows: number;
  cols: number;
  data: Uint8Array;
  data32S: Int32Array;
  data32F: Float32Array;
  delete: () => void;
  type: () => number;
}

export interface CvMatVector {
  size: () => number;
  get: (index: number) => CvMat;
  delete: () => void;
}

export interface OpenCvRuntime {
  Mat: new () => CvMat;
  MatVector: new () => CvMatVector;
  Size: new (width: number, height: number) => CvSize;
  Scalar: new (...values: number[]) => CvScalar;
  imread: (canvas: HTMLCanvasElement) => CvMat;
  imshow: (canvas: HTMLCanvasElement, mat: CvMat) => void;
  cvtColor: (src: CvMat, dst: CvMat, code: number) => void;
  GaussianBlur: (
    src: CvMat,
    dst: CvMat,
    size: CvSize,
    sigmaX: number,
    sigmaY: number,
    borderType: number,
  ) => void;
  Canny: (
    src: CvMat,
    dst: CvMat,
    threshold1: number,
    threshold2: number,
    apertureSize: number,
    l2gradient: boolean,
  ) => void;
  adaptiveThreshold: (
    src: CvMat,
    dst: CvMat,
    maxValue: number,
    adaptiveMethod: number,
    thresholdType: number,
    blockSize: number,
    c: number,
  ) => void;
  threshold: (
    src: CvMat,
    dst: CvMat,
    threshold: number,
    maxValue: number,
    type: number,
  ) => void;
  getStructuringElement: (
    shape: number,
    size: CvSize,
    anchor?: { x: number; y: number },
  ) => CvMat;
  morphologyEx: (
    src: CvMat,
    dst: CvMat,
    operation: number,
    kernel: CvMat,
  ) => void;
  dilate: (
    src: CvMat,
    dst: CvMat,
    kernel: CvMat,
  ) => void;
  findContours: (
    image: CvMat,
    contours: CvMatVector,
    hierarchy: CvMat,
    mode: number,
    method: number,
  ) => void;
  contourArea: (contour: CvMat, oriented?: boolean) => number;
  arcLength: (curve: CvMat, closed: boolean) => number;
  approxPolyDP: (
    curve: CvMat,
    approxCurve: CvMat,
    epsilon: number,
    closed: boolean,
  ) => void;
  isContourConvex: (contour: CvMat) => boolean;
  matFromArray: (
    rows: number,
    cols: number,
    type: number,
    data: number[],
  ) => CvMat;
  getPerspectiveTransform: (src: CvMat, dst: CvMat) => CvMat;
  warpPerspective: (
    src: CvMat,
    dst: CvMat,
    matrix: CvMat,
    size: CvSize,
    flags: number,
    borderMode: number,
    borderValue: CvScalar,
  ) => void;
  CV_8UC1: number;
  CV_8UC4: number;
  CV_32FC2: number;
  COLOR_RGBA2GRAY: number;
  COLOR_GRAY2RGBA: number;
  ADAPTIVE_THRESH_GAUSSIAN_C: number;
  THRESH_BINARY: number;
  THRESH_OTSU: number;
  MORPH_CLOSE: number;
  MORPH_RECT: number;
  RETR_LIST: number;
  CHAIN_APPROX_SIMPLE: number;
  INTER_LINEAR: number;
  BORDER_CONSTANT: number;
}

declare global {
  interface Window {
    cv?: OpenCvRuntime | Promise<OpenCvRuntime>;
  }
}

type ProgressListener = (progress: number) => void;

const OPENCV_PATH = `${import.meta.env.BASE_URL}vendor/opencv.js`;
const LOAD_TIMEOUT_MS = 60000;

let runtime: OpenCvRuntime | null = null;
let loadingPromise: Promise<OpenCvRuntime> | null = null;
let currentProgress = 0;
const progressListeners = new Set<ProgressListener>();

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function setProgress(progress: number): void {
  currentProgress = Math.min(100, Math.max(0, progress));

  for (const listener of progressListeners) {
    listener(currentProgress);
  }
}

function isRuntimeReady(candidate: unknown): candidate is OpenCvRuntime {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const value = candidate as Partial<OpenCvRuntime>;
  return (
    typeof value.Mat === 'function' &&
    typeof value.getPerspectiveTransform === 'function' &&
    typeof value.warpPerspective === 'function'
  );
}

function injectScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = OPENCV_PATH;
    script.async = true;
    script.dataset.docuxOpencv = 'true';
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      reject(new Error('No se pudo cargar OpenCV.js.'));
    };
    document.head.appendChild(script);
  });
}

async function warmAssetCache(): Promise<void> {
  try {
    const response = await fetch(OPENCV_PATH, { cache: 'force-cache' });

    if (!response.ok || !response.body) {
      return;
    }

    const total = Number(response.headers.get('Content-Length') ?? 0);
    const reader = response.body.getReader();
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      received += value.byteLength;
      if (total > 0) {
        setProgress(5 + Math.round((received / total) * 65));
      }
    }
  } catch {
    // Si el fetch falla, el script aún puede cargar desde la caché del navegador.
  }
}

async function waitForRuntime(): Promise<OpenCvRuntime> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < LOAD_TIMEOUT_MS) {
    const candidate = window.cv;

    if (candidate && typeof candidate === 'object' && 'then' in candidate) {
      try {
        const resolved = await (
          candidate as unknown as Promise<OpenCvRuntime>
        );

        if (isRuntimeReady(resolved)) {
          window.cv = resolved;
          return resolved;
        }
      } catch {
        // Se sigue consultando el objeto global.
      }
    }

    if (isRuntimeReady(candidate)) {
      return candidate;
    }

    await delay(100);
  }

  throw new Error('OpenCV.js tardó demasiado en iniciar.');
}

async function loadRuntime(): Promise<OpenCvRuntime> {
  if (isRuntimeReady(window.cv)) {
    runtime = window.cv;
    setProgress(100);
    return runtime;
  }

  setProgress(3);
  await warmAssetCache();
  setProgress(76);

  if (!window.cv) {
    await injectScript();
  }

  setProgress(88);
  const loaded = await waitForRuntime();
  runtime = loaded;
  setProgress(100);
  return loaded;
}

export function getLoadedOpenCv(): OpenCvRuntime | null {
  if (isRuntimeReady(window.cv)) {
    runtime = window.cv;
  }

  return runtime;
}

export function loadOpenCv(onProgress?: ProgressListener): Promise<OpenCvRuntime> {
  if (runtime) {
    onProgress?.(100);
    return Promise.resolve(runtime);
  }

  if (isRuntimeReady(window.cv)) {
    runtime = window.cv;
    onProgress?.(100);
    return Promise.resolve(runtime);
  }

  if (!loadingPromise) {
    loadingPromise = loadRuntime().catch((error: unknown) => {
      loadingPromise = null;
      setProgress(0);
      throw error;
    });
  }

  const promise = loadingPromise;

  if (onProgress) {
    progressListeners.add(onProgress);
    onProgress(currentProgress);
    void promise.then(
      () => progressListeners.delete(onProgress),
      () => progressListeners.delete(onProgress),
    );
  }

  return promise;
}
