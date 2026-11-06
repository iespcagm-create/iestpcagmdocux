import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { Icon } from '../../../shared/ui/Icon';
import {
  downloadBlob,
  sharePdf,
  formatBytes,
} from '../../../shared/utils/files';
import { useObjectUrl } from '../../../shared/utils/useObjectUrl';
import { saveDocument } from '../../documents/infrastructure/indexedDb';
import {
  captureVideoFrame,
  getSourceRect,
  getFrameSignature,
  meanAbsoluteDifference,
  rotateImageBlob,
} from '../infrastructure/capture';
import {
  createVideoAnalysisCanvas,
  detectQuadInCanvas,
} from '../infrastructure/documentDetection';
import { speakText, playCaptureSound } from '../infrastructure/feedback';
import {
  getImageDimensions,
  yieldToBrowser,
} from '../infrastructure/image';
import {
  getLoadedOpenCv,
  loadOpenCv,
} from '../infrastructure/opencv';
import {
  defaultPdfName,
  generatePdf,
  sanitizePdfName,
} from '../infrastructure/pdf';
import {
  setTorchEnabled,
  supportsTorch,
} from '../infrastructure/torch';
import {
  maxCornerDistance,
  quadAreaRatio,
  scaleQuad,
  type Quad,
} from '../domain/documentGeometry';
import { DocumentEditor, type PendingCapture } from './DocumentEditor';
import { useScanSession, type ScanPage } from './scanSessionContext';

type CaptureMode = 'manual' | 'auto';
type CameraState = 'starting' | 'ready' | 'error';
type CvState = 'idle' | 'loading' | 'ready' | 'error';
type DetectionStatus = 'none' | 'unstable' | 'stable';

interface LiveDetection {
  corners: Quad | null;
  status: DetectionStatus;
  areaRatio: number;
  updatedAt: number;
}

const EMPTY_DETECTION: LiveDetection = {
  corners: null,
  status: 'none',
  areaRatio: 0,
  updatedAt: 0,
};

const STABLE_THRESHOLD = 8;
const MOTION_THRESHOLD = 12;
const AUTO_COOLDOWN_MS = 2300;
const AUTO_STABILITY_MS = 1200;
const LIVE_STABILITY_MOVEMENT = 0.03;
const LIVE_MIN_AREA_RATIO = 0.15;
const MAX_CAPTURE_SIDE = 2400;

function createDocumentId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isCameraBlockedByPolicy(): boolean {
  const policyDocument = document as Document & {
    featurePolicy?: { allowsFeature(feature: string): boolean };
    permissionsPolicy?: { allowsFeature(feature: string): boolean };
  };
  const policy =
    policyDocument.permissionsPolicy ?? policyDocument.featurePolicy;

  return policy?.allowsFeature('camera') === false;
}

function cameraErrorMessage(error: unknown): string {
  const name =
    error instanceof DOMException
      ? error.name
      : error instanceof Error
        ? error.name
        : '';

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Permiso de cÃ¡mara denegado. Habilite la cÃ¡mara para DOCUX en la configuraciÃ³n del navegador y vuelva a intentarlo.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No se encontrÃ³ una cÃ¡mara en este dispositivo.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'La cÃ¡mara estÃ¡ ocupada por otra aplicaciÃ³n. Cierre la otra aplicaciÃ³n y vuelva a intentarlo.';
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'La cÃ¡mara no admite la configuraciÃ³n solicitada. Se intentarÃ¡ con la cÃ¡mara disponible.';
    case 'SecurityError':
      return 'El navegador bloqueÃ³ la cÃ¡mara. Abra DOCUX con HTTPS o desde localhost.';
    default:
      return 'No se pudo iniciar la cÃ¡mara. Compruebe los permisos o use un navegador compatible con HTTPS o localhost.';
  }
}

interface PageCardProps {
  page: ScanPage;
  index: number;
  total: number;
  replacing: boolean;
  onView: () => void;
  onDelete: () => void;
  onRepeat: () => void;
  onRotate: (blob: Blob) => Promise<void>;
  onMove: (direction: -1 | 1) => void;
}

function PageCard({
  page,
  index,
  total,
  replacing,
  onView,
  onDelete,
  onRepeat,
  onRotate,
  onMove,
}: PageCardProps) {
  const url = useObjectUrl(page.blob);
  const [rotating, setRotating] = useState(false);

  const handleRotate = async () => {
    setRotating(true);
    try {
      const rotated = await rotateImageBlob(page.blob);
      await onRotate(rotated);
    } finally {
      setRotating(false);
    }
  };

  return (
    <article className={`scan-page${replacing ? ' scan-page--replacing' : ''}`}>
      <button
        aria-label={`Ver pÃ¡gina ${index + 1}`}
        className="scan-page__thumb"
        onClick={onView}
        type="button"
      >
        {url ? <img alt={`PÃ¡gina ${index + 1}`} src={url} /> : null}
        <span className="scan-page__number">{index + 1}</span>
      </button>

      <div className="scan-page__body">
        <div className="scan-page__heading">
          <strong>PÃ¡gina {index + 1}</strong>
          {replacing ? <span className="tag tag--soft-dark">Reemplazar</span> : null}
        </div>

        <div className="scan-page__actions">
          <button
            className="button button--secondary button--small"
            onClick={onView}
            type="button"
          >
            Ver
          </button>
          <button
            className="button button--secondary button--small"
            onClick={onRepeat}
            type="button"
          >
            Repetir
          </button>
          <button
            className="button button--secondary button--small"
            disabled={rotating}
            onClick={() => void handleRotate()}
            type="button"
          >
            {rotating ? 'Girandoâ€¦' : 'Girar 90Â°'}
          </button>
          <button
            className="button button--secondary button--small"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            type="button"
          >
            Subir
          </button>
          <button
            className="button button--secondary button--small"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            type="button"
          >
            Bajar
          </button>
          <button
            className="button button--danger button--small"
            onClick={onDelete}
            type="button"
          >
            Eliminar
          </button>
        </div>
      </div>
    </article>
  );
}

interface PagePreviewProps {
  blob: Blob;
  index: number;
  onClose: () => void;
}

function PagePreview({ blob, index, onClose }: PagePreviewProps) {
  const url = useObjectUrl(blob);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="page-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        aria-labelledby="page-preview-title"
        aria-modal="true"
        className="page-modal"
        role="dialog"
      >
        <div className="page-modal__header">
          <h2 id="page-preview-title">PÃ¡gina {index + 1}</h2>
          <button
            className="button button--secondary button--small"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            Cerrar
          </button>
        </div>
        {url ? <img alt={`Vista de la pÃ¡gina ${index + 1}`} src={url} /> : null}
      </div>
    </div>
  );
}

export function ScannerPage() {
  const {
    pages,
    voiceEnabled,
    setVoiceEnabled,
    addPage,
    replacePage,
    removePage,
    movePage,
  } = useScanSession();

  const [mode, setMode] = useState<CaptureMode>('manual');
  const [guideOrientation, setGuideOrientation] = useState<'vertical' | 'horizontal'>(
    'vertical',
  );
  const [cameraState, setCameraState] = useState<CameraState>('starting');
  const [cameraError, setCameraError] = useState('');
  const [captureMessage, setCaptureMessage] = useState('');
  const [autoHint, setAutoHint] = useState(
    'Coloque el documento dentro de la guÃ­a y mantÃ©ngalo quieto.',
  );
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [flashing, setFlashing] = useState(false);
  const [pdfName, setPdfName] = useState(() => defaultPdfName());
  const [pdfResult, setPdfResult] = useState<{
    blob: Blob;
    filename: string;
    size: number;
  } | null>(null);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfMessage, setPdfMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [pendingCapture, setPendingCapture] = useState<PendingCapture | null>(null);
  const [cvState, setCvState] = useState<CvState>('idle');
  const [cvProgress, setCvProgress] = useState(0);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchBusy, setTorchBusy] = useState(false);
  const [autoNeedsMovement, setAutoNeedsMovement] = useState(false);
  const [liveDetection, setLiveDetection] = useState<LiveDetection>(EMPTY_DETECTION);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const voiceRef = useRef(voiceEnabled);
  const countdownRef = useRef<number | null>(null);
  const capturingRef = useRef(false);
  const autoCooldownUntilRef = useRef(0);
  const autoNeedsMovementRef = useRef(false);
  const savedDocumentIdRef = useRef<string | null>(null);
  const pendingCaptureRef = useRef<PendingCapture | null>(null);
  const cvStateRef = useRef<CvState>('idle');
  const torchOnRef = useRef(false);
  const liveDetectionRef = useRef<LiveDetection>(EMPTY_DETECTION);

  useEffect(() => {
    voiceRef.current = voiceEnabled;
    if (!voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [voiceEnabled]);

  useEffect(() => {
    cvStateRef.current = cvState;
  }, [cvState]);

  useEffect(() => {
    torchOnRef.current = torchOn;
  }, [torchOn]);

  useEffect(() => {
    pendingCaptureRef.current = pendingCapture;
  }, [pendingCapture]);

  useEffect(() => {
    liveDetectionRef.current = liveDetection;
  }, [liveDetection]);

  const resetPdfOutput = useCallback(() => {
    setPdfResult(null);
    setPdfMessage('');
    setSaveMessage('');
    setPdfProgress(0);
    savedDocumentIdRef.current = null;
  }, []);

  const stopCamera = useCallback(() => {
    const stream = streamRef.current;
    const track = stream?.getVideoTracks()[0];

    if (track) {
      void setTorchEnabled(track, false);
    }

    stream?.getTracks().forEach((cameraTrack) => cameraTrack.stop());
    streamRef.current = null;
    torchOnRef.current = false;
    setTorchOn(false);
    setTorchSupported(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState('starting');
    setCameraError('');
    stopCamera();

    if (!window.isSecureContext) {
      setCameraState('error');
      setCameraError(
        'Navegador incompatible o contexto no seguro. Abra DOCUX con HTTPS o desde localhost para usar la cÃ¡mara.',
      );
      return;
    }

    if (isCameraBlockedByPolicy()) {
      setCameraState('error');
      setCameraError(
        'La polÃ­tica de seguridad del sitio estÃ¡ bloqueando la cÃ¡mara. El administrador debe permitir camera=(self) en la cabecera Permissions-Policy.',
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('error');
      setCameraError(
        'Navegador incompatible: no admite acceso a la cÃ¡mara. Use Chrome, Edge, Firefox o Safari actualizado.',
      );
      return;
    }

    try {
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
      } catch (error) {
        if (
          error instanceof DOMException &&
          (error.name === 'OverconstrainedError' ||
            error.name === 'ConstraintNotSatisfiedError')
        ) {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
        } else {
          throw error;
        }
      }

      streamRef.current = stream;
      const video = videoRef.current;

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      video.srcObject = stream;
      await video.play().catch(() => undefined);
      setVideoSize({
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
      });
      setTorchSupported(supportsTorch(stream.getVideoTracks()[0] ?? null));
      setTorchOn(false);
      setCameraState('ready');
    } catch (error) {
      setCameraState('error');
      setCameraError(cameraErrorMessage(error));
    }
  }, [stopCamera]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void startCamera();
    }, 0);

    if ('speechSynthesis' in window && voiceRef.current) {
      speakText('Iniciando escaneo', true);
    }

    return () => {
      window.clearTimeout(timer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (
      cameraState !== 'ready' ||
      cvState === 'ready' ||
      cvState === 'loading'
    ) {
      return;
    }

    if (cvState === 'error') {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      setCvState('loading');
      setCvProgress(0);

      void loadOpenCv((progress) => {
        if (!cancelled) {
          setCvProgress(progress);
        }
      })
        .then(() => {
          if (!cancelled) {
            setCvState('ready');
            setCvProgress(100);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setCvState('error');
            setMode('manual');
            setAutoHint(
              'La detecciÃ³n automÃ¡tica no estÃ¡ disponible. Use el ajuste manual.',
            );
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cameraState, cvState]);

  useEffect(() => {
    if (
      cameraState !== 'ready' ||
      cvState !== 'ready' ||
      pendingCapture !== null
    ) {
      return;
    }

    let cancelled = false;
    let busy = false;
    let previousCorners: Quad | null = null;
    let stableFrames = 0;

    const detect = async () => {
      if (busy || cancelled || capturingRef.current) {
        return;
      }

      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        return;
      }

      busy = true;

      try {
        await yieldToBrowser();
        const frame = createVideoAnalysisCanvas(video, 960);
        const cv = getLoadedOpenCv();

        if (!frame || !cv || cancelled) {
          return;
        }

        const detected = detectQuadInCanvas(frame, cv);

        if (!detected) {
          previousCorners = null;
          stableFrames = 0;
          const next: LiveDetection = {
            corners: null,
            status: 'none',
            areaRatio: 0,
            updatedAt: performance.now(),
          };
          liveDetectionRef.current = next;
          setLiveDetection(next);
          return;
        }

        const scaled = scaleQuad(
          detected.corners,
          video.videoWidth / frame.width,
          video.videoHeight / frame.height,
        );
        const movement =
          previousCorners === null
            ? Infinity
            : maxCornerDistance(scaled, previousCorners) /
              Math.max(1, Math.hypot(video.videoWidth, video.videoHeight));
        stableFrames =
          movement <= LIVE_STABILITY_MOVEMENT ? stableFrames + 1 : 0;
        previousCorners = scaled;
        const areaRatio = quadAreaRatio(
          scaled,
          video.videoWidth,
          video.videoHeight,
        );
        const status: DetectionStatus =
          stableFrames >= 2 &&
          areaRatio >= LIVE_MIN_AREA_RATIO
            ? 'stable'
            : 'unstable';
        const next: LiveDetection = {
          corners: scaled,
          status,
          areaRatio,
          updatedAt: performance.now(),
        };

        liveDetectionRef.current = next;
        setLiveDetection(next);
      } catch {
        const next: LiveDetection = {
          corners: null,
          status: 'none',
          areaRatio: 0,
          updatedAt: performance.now(),
        };
        liveDetectionRef.current = next;
        setLiveDetection(next);
      } finally {
        busy = false;
      }
    };

    void detect();
    const interval = window.setInterval(() => {
      void detect();
    }, 200);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [cameraState, cvState, pendingCapture]);

  const capturePage = useCallback(async () => {
    if (capturingRef.current || cameraState !== 'ready') {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    capturingRef.current = true;
    setCapturing(true);
    setCaptureMessage('');
    countdownRef.current = null;
    setCountdown(null);

    try {
      const blob = await captureVideoFrame(video, null, MAX_CAPTURE_SIDE);
      const size = await getImageDimensions(blob);
      const guideRect = getSourceRect(video, guideRef.current);
      const guideCorners = guideRect
        ? ([
            { x: guideRect.x, y: guideRect.y },
            { x: guideRect.x + guideRect.width, y: guideRect.y },
            {
              x: guideRect.x + guideRect.width,
              y: guideRect.y + guideRect.height,
            },
            { x: guideRect.x, y: guideRect.y + guideRect.height },
          ] as Quad)
        : null;
      const capture: PendingCapture = {
        blob,
        width: size.width,
        height: size.height,
        targetIndex: replaceIndex,
        guideCorners,
      };

      pendingCaptureRef.current = capture;
      setPendingCapture(capture);
      autoCooldownUntilRef.current = performance.now() + AUTO_COOLDOWN_MS;
      autoNeedsMovementRef.current = true; setAutoNeedsMovement(true);
      setFlashing(true);
      window.setTimeout(() => setFlashing(false), 220);
      playCaptureSound();
    } catch {
      setCaptureMessage(
        'No se pudo capturar la pÃ¡gina. Mantenga la cÃ¡mara activa y vuelva a intentarlo.',
      );
    } finally {
      capturingRef.current = false;
      setCapturing(false);
    }
  }, [cameraState, replaceIndex]);

  const handleEditorConfirm = useCallback(
    (blob: Blob) => {
      const capture = pendingCaptureRef.current;

      if (
        capture?.targetIndex !== null &&
        capture?.targetIndex !== undefined
      ) {
        replacePage(capture.targetIndex, blob);
      } else {
        addPage(blob);
      }

      pendingCaptureRef.current = null;
      setPendingCapture(null);
      setReplaceIndex(null);
      resetPdfOutput();
      setAutoHint('PÃ¡gina agregada. Coloque el siguiente documento.');
      setFlashing(true);
      window.setTimeout(() => setFlashing(false), 220);
      speakText('Escaneo terminado', voiceRef.current);
    },
    [addPage, replacePage, resetPdfOutput],
  );

  const handleEditorRetake = useCallback(() => {
    pendingCaptureRef.current = null;
    setPendingCapture(null);
    setCaptureMessage('');
  }, []);

  useEffect(() => {
    if (mode !== 'auto' || cameraState !== 'ready') {
      return;
    }

    if (cvState !== 'ready') {
      return;
    }

    let previousSignature: Uint8ClampedArray | null = null;
    let stableSince: number | null = null;
    let motionStreak = 0;
    let noDetectionStableSince: number | null = null;

    const interval = window.setInterval(() => {
      if (capturingRef.current || pendingCapture !== null) {
        return;
      }

      const video = videoRef.current;
      if (!video) {
        return;
      }

      const signature = getFrameSignature(video, guideRef.current);
      if (!signature) {
        return;
      }

      if (previousSignature === null) {
        previousSignature = signature;
        return;
      }

      const difference = meanAbsoluteDifference(previousSignature, signature);
      previousSignature = signature;
      const now = performance.now();
      const detection = liveDetectionRef.current;
      const detectionFresh = now - detection.updatedAt < 1200;
      const detectionValid =
        detection.corners !== null &&
        detection.areaRatio >= LIVE_MIN_AREA_RATIO;
      const detectionStable =
        detection.status === 'stable' && detectionFresh && detectionValid;

      if (now < autoCooldownUntilRef.current) {
        return;
      }

      if (!detectionValid) {
        if (difference <= STABLE_THRESHOLD) {
          if (noDetectionStableSince === null) {
            noDetectionStableSince = now;
          }
        } else {
          noDetectionStableSince = null;
        }
      } else {
        noDetectionStableSince = null;
      }

      const fallbackReady =
        !detectionValid &&
        noDetectionStableSince !== null &&
        now - noDetectionStableSince >= 3000;
      const canProceed = detectionStable || fallbackReady;

      if (autoNeedsMovementRef.current) {
        if (
          difference > MOTION_THRESHOLD &&
          canProceed
        ) {
          autoNeedsMovementRef.current = false; setAutoNeedsMovement(false);
          stableSince = now;
          motionStreak = 0;
          setAutoHint(
            fallbackReady
              ? 'DetecciÃ³n parcial. Mantenga estable para capturar.'
              : 'Documento detectado. Mantenga la pÃ¡gina quieta dentro de la guÃ­a.',
          );
        } else if (!detectionValid) {
          setAutoHint('Coloque la hoja completa dentro del marco.');
        }
        return;
      }

      if (!canProceed) {
        stableSince = null;

        if (countdownRef.current !== null) {
          countdownRef.current = null;
          setCountdown(null);
          setAutoHint(
            fallbackReady
              ? 'DetecciÃ³n parcial. Mantenga estable para capturar.'
              : 'Coloque la hoja completa dentro del marco.',
          );
        } else {
          setAutoHint(
            fallbackReady
              ? 'DetecciÃ³n parcial. Mantenga estable para capturar.'
              : 'Coloque la hoja completa dentro del marco.',
          );
        }
        return;
      }

      if (difference > MOTION_THRESHOLD) {
        motionStreak += 1;
        stableSince = null;

        if (motionStreak >= 2) {
          if (countdownRef.current !== null) {
            countdownRef.current = null;
            setCountdown(null);
            setAutoHint(
              'La imagen se moviÃ³. Cuenta regresiva cancelada; vuelva a estabilizarla.',
            );
          } else {
            setAutoHint('Mantenga el documento quieto dentro de la guÃ­a.');
          }
        }
        return;
      }

      motionStreak = 0;

      if (difference <= STABLE_THRESHOLD) {
        if (stableSince === null) {
          stableSince = now;
        }

        if (
          countdownRef.current === null &&
          now - stableSince >= AUTO_STABILITY_MS
        ) {
          countdownRef.current = 3;
          setCountdown(3);
          setAutoHint(
            'Imagen estable. Captura automÃ¡tica en 3 segundos.',
          );
        }
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [cameraState, mode, cvState, pendingCapture]);

  useEffect(() => {
    if (countdown === null) {
      return;
    }

    if (countdown <= 0) {
      const timer = window.setTimeout(() => {
        countdownRef.current = null;
        setCountdown(null);
        void capturePage().then(() => {
          if (mode === 'auto') {
            setAutoHint(
              'PÃ¡gina capturada. Retire el documento y coloque la siguiente pÃ¡gina.',
            );
          }
        });
      }, 0);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setCountdown((current) => {
        if (current === null) {
          return null;
        }
        const next = current - 1;
        countdownRef.current = next;
        return next;
      });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [capturePage, countdown, mode]);

  const handleModeChange = (nextMode: CaptureMode) => {
    setMode(nextMode);
    setCaptureMessage('');
    countdownRef.current = null;
    setCountdown(null);
    autoNeedsMovementRef.current = nextMode === 'manual'; setAutoNeedsMovement(nextMode === 'manual');
    setAutoHint(
      nextMode === 'auto'
        ? 'La captura automÃ¡tica exige cuatro esquinas estables y corrige la perspectiva.'
        : 'Coloque el documento dentro de la guÃ­a y mantÃ©ngalo quieto.',
    );
  };

  const handleRotate = async (index: number, blob: Blob) => {
    replacePage(index, blob);
    resetPdfOutput();
  };

  const handleGeneratePdf = async () => {
    if (pages.length === 0) {
      setPdfMessage('Agregue al menos una pÃ¡gina antes de generar el PDF.');
      return;
    }

    const cleanName = sanitizePdfName(pdfName);
    if (!cleanName) {
      setPdfMessage(
        'Escriba un nombre de archivo vÃ¡lido (sin caracteres como / \\ : * ? " < > |).',
      );
      return;
    }

    if (cleanName !== pdfName) {
      setPdfName(cleanName);
    }

    setPdfBusy(true);
    setPdfProgress(0);
    setPdfMessage('');
    setSaveMessage('');
    setPdfResult(null);

    try {
      const blob = await generatePdf(
        pages.map((page) => page.blob),
        setPdfProgress,
      );
      setPdfResult({ blob, filename: cleanName, size: blob.size });

      const documentId =
        savedDocumentIdRef.current ?? createDocumentId();
      savedDocumentIdRef.current = documentId;

      try {
        await saveDocument({
          id: documentId,
          name: cleanName,
          createdAt: new Date().toISOString(),
          pageCount: pages.length,
          size: blob.size,
          pdfBlob: blob,
          pages: pages.map((page) => ({
            blob: page.blob,
            createdAt: page.createdAt,
          })),
        });
        setSaveMessage('Documento guardado en este dispositivo.');
      } catch {
        setSaveMessage(
          'PDF generado. No se pudo guardar en este dispositivo; descÃ¡rguelo o compÃ¡rtalo.',
        );
      }
    } catch {
      setPdfMessage(
        'No se pudo generar el PDF. Compruebe que las pÃ¡ginas siguen disponibles e intÃ©ntelo de nuevo.',
      );
    } finally {
      setPdfBusy(false);
    }
  };

  const handleDownloadClick = () => {
    if (!pdfResult) {
      return;
    }

    downloadBlob(pdfResult.blob, pdfResult.filename);
    setPdfMessage('PDF descargado.');
  };

  const handleShareClick = async () => {
    if (!pdfResult) {
      return;
    }

    setPdfMessage('');
    const result = await sharePdf(pdfResult.blob, pdfResult.filename);

    if (result === 'downloaded') {
      setPdfMessage(
        'PDF descargado. Puede adjuntarlo en OneDrive, Google Drive, correo o WhatsApp',
      );
    } else if (result === 'shared') {
      setPdfMessage('PDF compartido.');
    }
  };

  const handleTorchToggle = async () => {
    if (!torchSupported || torchBusy) {
      return;
    }

    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) {
      return;
    }

    const next = !torchOnRef.current;
    setTorchBusy(true);

    const applied = await setTorchEnabled(track, next);

    if (applied) {
      torchOnRef.current = next;
      setTorchOn(next);
    } else {
      setTorchSupported(false);
      setCaptureMessage(
        'Flash no disponible en este dispositivo.',
      );
    }

    setTorchBusy(false);
  };

  useEffect(() => {
    const handleLogout = () => {
      stopCamera();
      setCameraState('starting');
    };
    window.addEventListener('docux:logout', handleLogout);
    return () => window.removeEventListener('docux:logout', handleLogout);
  }, [stopCamera]);

  const pageCountLabel = useMemo(
    () => `${pages.length} ${pages.length === 1 ? 'pÃ¡gina' : 'pÃ¡ginas'}`,
    [pages.length],
  );

  const estimatedPdfSize = useMemo(
    () =>
      pages.reduce((total, page) => total + page.blob.size, 0) +
      pages.length * 1200 +
      800,
    [pages],
  );

  const liveOverlayPoints =
    liveDetection.corners !== null
      ? liveDetection.corners
          .map((point) => `${point.x},${point.y}`)
          .join(' ')
      : '';

  return (
    <div className="page-stack">
      <PageHeader
        description="Capture pÃ¡ginas con la cÃ¡mara posterior, organÃ­celas y genere un PDF para descargarlo o compartirlo."
        eyebrow="Escanear"
        title="Escanear documento"
      />

      <section className="scanner-panel" aria-labelledby="scanner-title">
        <h2 className="sr-only" id="scanner-title">
          CÃ¡mara y captura
        </h2>

        <div className="scanner-toolbar">
          <div
            aria-label="Modo de captura"
            className="mode-switch"
            role="group"
          >
            <button
              aria-pressed={mode === 'manual'}
              className={`mode-switch__button${
                mode === 'manual' ? ' mode-switch__button--active' : ''
              }`}
              onClick={() => handleModeChange('manual')}
              type="button"
            >
              Manual
            </button>
            <button
              aria-pressed={mode === 'auto'}
              className={`mode-switch__button${
                mode === 'auto' ? ' mode-switch__button--active' : ''
              }`}
              disabled={
                cvState === 'loading' || cvState === 'error'
              }
              onClick={() => handleModeChange('auto')}
              type="button"
            >
              AutomÃ¡tico
            </button>
          </div>

          <label className="switch">
            <input
              checked={voiceEnabled}
              onChange={(event) => setVoiceEnabled(event.target.checked)}
              type="checkbox"
            />
            <span aria-hidden="true" className="switch__track">
              <span className="switch__thumb" />
            </span>
            <span>Avisos de voz</span>
          </label>
        </div>

        {cvState === 'loading' ? (
          <div className="opencv-status" role="status">
            <progress max={100} value={cvProgress} />
            <span>Cargando detecciÃ³n OpenCV.js: {cvProgress}%</span>
          </div>
        ) : null}

        {cvState === 'error' ? (
          <div className="notice notice--info replace-notice">
            <Icon name="info" size={20} />
            <div>
              <p>
                La detecciÃ³n automÃ¡tica no estÃ¡ disponible. Puede capturar y
                ajustar las esquinas manualmente.
              </p>
              <button
                className="button button--secondary button--small"
                onClick={() => setCvState('idle')}
                type="button"
              >
                Reintentar detecciÃ³n
              </button>
            </div>
          </div>
        ) : null}

        <div className="scan-orientation" role="group" aria-label="OrientaciÃ³n de la guÃ­a">
          <span>OrientaciÃ³n:</span>
          <button
            aria-pressed={guideOrientation === 'vertical'}
            className={`scan-orientation__button${
              guideOrientation === 'vertical'
                ? ' scan-orientation__button--active'
                : ''
            }`}
            onClick={() => setGuideOrientation('vertical')}
            type="button"
          >
            Vertical
          </button>
          <button
            aria-pressed={guideOrientation === 'horizontal'}
            className={`scan-orientation__button${
              guideOrientation === 'horizontal'
                ? ' scan-orientation__button--active'
                : ''
            }`}
            onClick={() => setGuideOrientation('horizontal')}
            type="button"
          >
            Horizontal
          </button>
        </div>

        <div
          className={`camera-stage${
            flashing ? ' camera-stage--flashing' : ''
          }`}
          ref={scannerRef}
        >
          <video
            autoPlay
            className="camera-video"
            muted
            playsInline
            ref={videoRef}
          />

          {cameraState === 'ready' ? (
            <div
              aria-hidden="true"
              className={`scan-guide scan-guide--${guideOrientation}${
                liveDetection.status === 'stable'
                  ? ' scan-guide--detected'
                  : ''
              }`}
              ref={guideRef}
            >
              <span className="scan-guide__corner scan-guide__corner--tl" />
              <span className="scan-guide__corner scan-guide__corner--tr" />
              <span className="scan-guide__corner scan-guide__corner--bl" />
              <span className="scan-guide__corner scan-guide__corner--br" />
            </div>
          ) : null}

          {cameraState === 'ready' &&
          cvState === 'ready' &&
          pendingCapture === null &&
          liveDetection.corners !== null ? (
            <svg
              aria-hidden="true"
              className={`detection-overlay detection-overlay--${liveDetection.status}`}
              preserveAspectRatio="xMidYMid slice"
              viewBox={`0 0 ${videoSize.width} ${videoSize.height}`}
            >
              <polygon points={liveOverlayPoints} />
            </svg>
          ) : null}

          {cameraState === 'ready' ? (
            <p
              aria-live="polite"
              className={`detection-badge detection-badge--${liveDetection.status}`}
              role="status"
            >
              {liveDetection.status === 'stable'
                ? 'Documento listo para capturar'
                : liveDetection.corners !== null
                  ? 'Aleje ligeramente la cÃ¡mara'
                  : 'Coloque la hoja completa dentro del marco'}
            </p>
          ) : null}

          {cameraState === 'ready' ? (
            <div className="camera-tools">
              <button
                aria-label={
                  torchSupported
                    ? torchOn
                      ? 'Flash encendido'
                      : 'Flash apagado'
                    : 'Flash no disponible en este dispositivo'
                }
                aria-pressed={torchOn}
                className={`torch-button${
                  torchOn ? ' torch-button--on' : ''
                }`}
                disabled={!torchSupported || torchBusy}
                onClick={() => void handleTorchToggle()}
                type="button"
              >
                <Icon name="spark" size={18} />
              </button>
              <span className="torch-label">
                {torchSupported
                  ? torchOn
                    ? 'Flash encendido'
                    : 'Flash apagado'
                  : 'Flash no disponible en este dispositivo'}
              </span>
            </div>
          ) : null}

          {cameraState === 'starting' ? (
            <div className="camera-overlay">
              <span className="camera-overlay__spinner" aria-hidden="true" />
              <p>Iniciando cÃ¡maraâ€¦</p>
            </div>
          ) : null}

          {cameraState === 'error' ? (
            <div className="camera-overlay camera-overlay--error" role="alert">
              <Icon name="camera" size={30} />
              <h2>No se pudo abrir la cÃ¡mara</h2>
              <p>{cameraError}</p>
              <button
                className="button button--light"
                onClick={() => void startCamera()}
                type="button"
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {countdown !== null ? (
            <div aria-live="assertive" className="countdown">
              <span>{countdown}</span>
              <p>Mantenga el documento quieto</p>
            </div>
          ) : null}

          <div aria-hidden="true" className="camera-flash" />
        </div>

        {new URLSearchParams(window.location.search).get('debugScanner') === '1' ? (
          <div className="debug-panel" role="status">
            <p>Modo: {mode}</p>
            <p>Estado: {liveDetection.status}</p>
            <p>Esquinas: {liveDetection.corners ? 4 : 0}</p>
            <p>
              Ãrea:{' '}
              {Math.round(liveDetection.areaRatio * 100)}%
            </p>
            <p>Cuenta: {countdown ?? '-'}</p>
            <p>
              Bloqueo:{' '}
              {autoNeedsMovement ? 'sí' : 'no'}
            </p>
            <p>CV: {cvState}</p>
          </div>
        ) : null}

        {mode === 'manual' ? (
          <div className="capture-controls">
            <button
              className="button button--capture"
              disabled={cameraState !== 'ready' || capturing}
              onClick={() => void capturePage()}
              type="button"
            >
              <Icon name="camera" size={22} />
              {capturing ? 'Capturandoâ€¦' : 'Capturar pÃ¡gina'}
            </button>
            <p className="capture-hint">
              Alinee el documento dentro de la guÃ­a. DespuÃ©s podrÃ¡ ajustar las
              cuatro esquinas.
            </p>
          </div>
        ) : (
          <div className="capture-controls">
            <p className="auto-status" role="status">
              <span className="auto-status__dot" aria-hidden="true" />
              {autoHint}
            </p>
            <button
              className="button button--capture"
              disabled={cameraState !== 'ready' || capturing || pendingCapture !== null}
              onClick={() => void capturePage()}
              type="button"
            >
              <Icon name="camera" size={22} />
              Capturar ahora
            </button>
            <p className="capture-hint">
              Modo automÃ¡tico: la captura exige cuatro esquinas estables y corrige
              la perspectiva.
            </p>
          </div>
        )}

        {replaceIndex !== null ? (
          <div className="notice notice--info replace-notice">
            <Icon name="info" size={20} />
            <div>
              <p>
                La prÃ³xima captura reemplazarÃ¡ la pÃ¡gina {replaceIndex + 1}.
              </p>
              <button
                className="button button--secondary button--small"
                onClick={() => setReplaceIndex(null)}
                type="button"
              >
                Cancelar reemplazo
              </button>
            </div>
          </div>
        ) : null}

        {captureMessage ? (
          <p className="field-error" role="alert">
            {captureMessage}
          </p>
        ) : null}
      </section>

      <section className="scanned-pages" aria-labelledby="pages-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Bandeja</p>
            <h2 id="pages-title">PÃ¡ginas escaneadas</h2>
          </div>
          <span className="tag tag--muted">{pageCountLabel}</span>
        </div>

        {pages.length === 0 ? (
          <p className="scanner-empty">
            AÃºn no hay pÃ¡ginas en esta sesiÃ³n. Active la cÃ¡mara y capture la
            primera.
          </p>
        ) : (
          <div className="scan-pages-grid">
            {pages.map((page, index) => (
              <PageCard
                index={index}
                key={page.id}
                onDelete={() => {
                  removePage(index);
                  resetPdfOutput();
                  setReplaceIndex((current) =>
                    current === index ? null : current,
                  );
                  setPreviewIndex(null);
                }}
                onMove={(direction) => {
                  movePage(index, direction);
                  resetPdfOutput();
                }}
                onRepeat={() => {
                  setReplaceIndex(index);
                  handleModeChange('manual');
                  setAutoHint(
                    'La prÃ³xima captura reemplazarÃ¡ la pÃ¡gina seleccionada.',
                  );
                  scannerRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
                onRotate={(blob) => handleRotate(index, blob)}
                onView={() => setPreviewIndex(index)}
                page={page}
                replacing={replaceIndex === index}
                total={pages.length}
              />
            ))}
          </div>
        )}
      </section>

      <section className="pdf-panel" aria-labelledby="pdf-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Salida</p>
            <h2 id="pdf-title">PDF del documento</h2>
          </div>
          {pdfResult ? (
            <span className="tag tag--muted">{formatBytes(pdfResult.size)}</span>
          ) : null}
        </div>

        <div className="pdf-panel__body">
          <div className="field">
            <label htmlFor="pdf-name">Nombre del documento</label>
            <input
              id="pdf-name"
              onChange={(event) => setPdfName(event.target.value)}
              type="text"
              value={pdfName}
            />
            <p className="field-hint">
              Se guardarÃ¡ como archivo PDF en este dispositivo y en el nombre de
              descarga.
            </p>
          </div>

          <button
            className="button button--primary"
            disabled={pdfBusy || pages.length === 0}
            onClick={() => void handleGeneratePdf()}
            type="button"
          >
            {pdfBusy ? 'Generando PDFâ€¦' : 'Generar PDF'}
          </button>

          {pdfBusy ? (
            <div className="pdf-progress">
              <progress
                aria-label="Progreso de generaciÃ³n del PDF"
                max={100}
                value={pdfProgress}
              />
              <p>{pdfProgress}%</p>
            </div>
          ) : null}

          {pdfResult ? (
            <div className="pdf-result">
              <p>
                <strong>TamaÃ±o aproximado:</strong>{' '}
                {formatBytes(pdfResult.size)}
              </p>
              {saveMessage ? <p role="status">{saveMessage}</p> : null}
              <div className="pdf-result__actions">
                <button
                  className="button button--primary"
                  onClick={handleDownloadClick}
                  type="button"
                >
                  Descargar PDF
                </button>
                <button
                  className="button button--secondary"
                  onClick={() => void handleShareClick()}
                  type="button"
                >
                  Compartir PDF
                </button>
              </div>
            </div>
          ) : (
            <p className="field-hint">
              {pages.length > 0
                ? `TamaÃ±o aproximado del PDF: ${formatBytes(estimatedPdfSize)}. `
                : ''}
              Genere el PDF para ver el tamaÃ±o y habilitar la descarga o el uso
              compartido.
            </p>
          )}

          {pdfMessage ? (
            <p className="field-success" role="status">
              {pdfMessage}
            </p>
          ) : null}
        </div>
      </section>

      {previewIndex !== null && pages[previewIndex] ? (
        <PagePreview
          blob={pages[previewIndex].blob}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      ) : null}

      {pendingCapture ? (
        <DocumentEditor
          capture={pendingCapture}
          onConfirm={handleEditorConfirm}
          onRetake={handleEditorRetake}
        />
      ) : null}
    </div>
  );
}
