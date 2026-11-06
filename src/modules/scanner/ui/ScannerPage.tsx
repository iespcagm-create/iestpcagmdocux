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
import { saveDocument } from '../../documents/infrastructure/indexedDb';
import {
  captureVideoFrame,
  getFrameSignature,
  meanAbsoluteDifference,
  rotateImageBlob,
} from '../infrastructure/capture';
import { speakText, playCaptureSound } from '../infrastructure/feedback';
import {
  defaultPdfName,
  generatePdf,
  sanitizePdfName,
} from '../infrastructure/pdf';
import { useScanSession, type ScanPage } from './scanSessionContext';

type CaptureMode = 'manual' | 'auto';
type CameraState = 'starting' | 'ready' | 'error';

const STABLE_THRESHOLD = 5.5;
const MOTION_THRESHOLD = 12;
const AUTO_COOLDOWN_MS = 2300;

function createDocumentId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function useObjectUrl(blob: Blob): string {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return url;
}

function cameraErrorMessage(error: unknown): string {  const name =
    error instanceof DOMException
      ? error.name
      : error instanceof Error
        ? error.name
        : '';

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Permiso de cámara denegado. Habilite la cámara para DOCUX en la configuración del navegador y vuelva a intentarlo.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No se encontró una cámara en este dispositivo.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'La cámara está ocupada por otra aplicación. Cierre la otra aplicación y vuelva a intentarlo.';
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'La cámara no admite la configuración solicitada. Se intentará con la cámara disponible.';
    case 'SecurityError':
      return 'El navegador bloqueó la cámara. Abra DOCUX con HTTPS o desde localhost.';
    default:
      return 'No se pudo iniciar la cámara. Compruebe los permisos o use un navegador compatible con HTTPS o localhost.';
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
        aria-label={`Ver página ${index + 1}`}
        className="scan-page__thumb"
        onClick={onView}
        type="button"
      >
        {url ? <img alt={`Página ${index + 1}`} src={url} /> : null}
        <span className="scan-page__number">{index + 1}</span>
      </button>

      <div className="scan-page__body">
        <div className="scan-page__heading">
          <strong>Página {index + 1}</strong>
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
            {rotating ? 'Girando…' : 'Girar 90°'}
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
          <h2 id="page-preview-title">Página {index + 1}</h2>
          <button
            className="button button--secondary button--small"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            Cerrar
          </button>
        </div>
        {url ? <img alt={`Vista de la página ${index + 1}`} src={url} /> : null}
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
  const [cameraState, setCameraState] = useState<CameraState>('starting');
  const [cameraError, setCameraError] = useState('');
  const [captureMessage, setCaptureMessage] = useState('');
  const [autoHint, setAutoHint] = useState(
    'Coloque el documento dentro de la guía y manténgalo quieto.',
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

  const resetPdfOutput = useCallback(() => {
    setPdfResult(null);
    setPdfMessage('');
    setSaveMessage('');
    setPdfProgress(0);
    savedDocumentIdRef.current = null;
  }, []);

  useEffect(() => {
    voiceRef.current = voiceEnabled;
    if (!voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [voiceEnabled]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
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
        'Navegador incompatible o contexto no seguro. Abra DOCUX con HTTPS o desde localhost para usar la cámara.',
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('error');
      setCameraError(
        'Navegador incompatible: no admite acceso a la cámara. Use Chrome, Edge, Firefox o Safari actualizado.',
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

    if (!('speechSynthesis' in window)) {
      // La voz es opcional; el escaneo continúa sin ella.
    } else if (voiceRef.current) {
      speakText('Iniciando escaneo', true);
    }

    return () => {
      window.clearTimeout(timer);
      stopCamera();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [startCamera, stopCamera]);

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

    try {
      const blob = await captureVideoFrame(video, guideRef.current);

      if (replaceIndex !== null) {
        replacePage(replaceIndex, blob);
        setReplaceIndex(null);
      } else {
        addPage(blob);
      }

      autoCooldownUntilRef.current = performance.now() + AUTO_COOLDOWN_MS;
      autoNeedsMovementRef.current = true;
      resetPdfOutput();
      setFlashing(true);
      window.setTimeout(() => setFlashing(false), 220);
      playCaptureSound();
      speakText('Escaneo terminado', voiceRef.current);
    } catch {
      setCaptureMessage(
        'No se pudo capturar la página. Mantenga la cámara activa y vuelva a intentarlo.',
      );
    } finally {
      capturingRef.current = false;
      setCapturing(false);
    }
  }, [addPage, cameraState, replaceIndex, replacePage, resetPdfOutput]);

  useEffect(() => {
    if (mode !== 'auto' || cameraState !== 'ready') {
      return;
    }

    let previousSignature: Uint8ClampedArray | null = null;
    let stableSince: number | null = null;
    let motionStreak = 0;

    const interval = window.setInterval(() => {
      if (capturingRef.current) {
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

      const difference = meanAbsoluteDifference(
        previousSignature,
        signature,
      );
      previousSignature = signature;
      const now = performance.now();

      if (now < autoCooldownUntilRef.current) {
        return;
      }

      if (autoNeedsMovementRef.current) {
        if (difference > MOTION_THRESHOLD) {
          autoNeedsMovementRef.current = false;
          stableSince = now;
          motionStreak = 0;
          setAutoHint(
            'Documento detectado. Mantenga la página quieta dentro de la guía.',
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
              'La imagen se movió. Cuenta regresiva cancelada; vuelva a estabilizarla.',
            );
          } else {
            setAutoHint(
              'Mantenga el documento quieto dentro de la guía.',
            );
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
          now - stableSince >= 1500
        ) {
          countdownRef.current = 3;
          setCountdown(3);
          setAutoHint(
            'Imagen estable. Captura automática en 3 segundos.',
          );
        }
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [cameraState, mode]);

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
              'Página capturada. Retire el documento y coloque la siguiente página.',
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
    setAutoHint(
      nextMode === 'auto'
        ? 'Detección básica de estabilidad. Mantenga el documento quieto durante 1.5 s; si se mueve, la cuenta se cancela.'
        : 'Coloque el documento dentro de la guía y manténgalo quieto.',
    );
  };

  const handleRotate = async (index: number, blob: Blob) => {
    replacePage(index, blob);
    resetPdfOutput();
  };

  const handleGeneratePdf = async () => {
    if (pages.length === 0) {
      setPdfMessage('Agregue al menos una página antes de generar el PDF.');
      return;
    }

    const cleanName = sanitizePdfName(pdfName);
    if (!cleanName) {
      setPdfMessage(
        'Escriba un nombre de archivo válido (sin caracteres como / \\ : * ? " < > |).',
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
          'PDF generado. No se pudo guardar en este dispositivo; descárguelo o compártalo.',
        );
      }
    } catch {
      setPdfMessage(
        'No se pudo generar el PDF. Compruebe que las páginas siguen disponibles e inténtelo de nuevo.',
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

  const pageCountLabel = useMemo(
    () => `${pages.length} ${pages.length === 1 ? 'página' : 'páginas'}`,
    [pages.length],
  );

  const estimatedPdfSize = useMemo(
    () =>
      pages.reduce((total, page) => total + page.blob.size, 0) +
      pages.length * 1200 +
      800,
    [pages],
  );

  return (
    <div className="page-stack">
      <PageHeader
        description="Capture páginas con la cámara posterior, organícelas y genere un PDF para descargarlo o compartirlo."
        eyebrow="Escanear"
        title="Escanear documento"
      />

      <section className="scanner-panel" aria-labelledby="scanner-title">
        <h2 className="sr-only" id="scanner-title">
          Cámara y captura
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
              onClick={() => handleModeChange('auto')}
              type="button"
            >
              Automático
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
            <div aria-hidden="true" className="scan-guide" ref={guideRef}>
              <span className="scan-guide__corner scan-guide__corner--tl" />
              <span className="scan-guide__corner scan-guide__corner--tr" />
              <span className="scan-guide__corner scan-guide__corner--bl" />
              <span className="scan-guide__corner scan-guide__corner--br" />
            </div>
          ) : null}

          {cameraState === 'starting' ? (
            <div className="camera-overlay">
              <span className="camera-overlay__spinner" aria-hidden="true" />
              <p>Iniciando cámara…</p>
            </div>
          ) : null}

          {cameraState === 'error' ? (
            <div className="camera-overlay camera-overlay--error" role="alert">
              <Icon name="camera" size={30} />
              <h2>No se pudo abrir la cámara</h2>
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

        {mode === 'manual' ? (
          <div className="capture-controls">
            <button
              className="button button--capture"
              disabled={cameraState !== 'ready' || capturing}
              onClick={() => void capturePage()}
              type="button"
            >
              <Icon name="camera" size={22} />
              {capturing ? 'Capturando…' : 'Capturar página'}
            </button>
            <p className="capture-hint">
              Alinee el documento dentro de la guía. La captura se recorta a esa
              área.
            </p>
          </div>
        ) : (
          <div className="capture-controls">
            <p className="auto-status" role="status">
              <span className="auto-status__dot" aria-hidden="true" />
              {autoHint}
            </p>
            <p className="capture-hint">
              Modo automático básico: usa diferencia entre fotogramas, no
              reconoce bordes ni corrige perspectiva.
            </p>
          </div>
        )}

        {replaceIndex !== null ? (
          <div className="notice notice--info replace-notice">
            <Icon name="info" size={20} />
            <div>
              <p>
                La próxima captura reemplazará la página {replaceIndex + 1}.
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
            <h2 id="pages-title">Páginas escaneadas</h2>
          </div>
          <span className="tag tag--muted">{pageCountLabel}</span>
        </div>

        {pages.length === 0 ? (
          <p className="scanner-empty">
            Aún no hay páginas en esta sesión. Active la cámara y capture la
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
                    'La próxima captura reemplazará la página seleccionada.',
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
              Se guardará como archivo PDF en este dispositivo y en el nombre de
              descarga.
            </p>
          </div>

          <button
            className="button button--primary"
            disabled={pdfBusy || pages.length === 0}
            onClick={() => void handleGeneratePdf()}
            type="button"
          >
            {pdfBusy ? 'Generando PDF…' : 'Generar PDF'}
          </button>

          {pdfBusy ? (
            <div className="pdf-progress">
              <progress
                aria-label="Progreso de generación del PDF"
                max={100}
                value={pdfProgress}
              />
              <p>{pdfProgress}%</p>
            </div>
          ) : null}

          {pdfResult ? (
            <div className="pdf-result">
              <p>
                <strong>Tamaño aproximado:</strong>{' '}
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
                ? `Tamaño aproximado del PDF: ${formatBytes(estimatedPdfSize)}. `
                : ''}
              Genere el PDF para ver el tamaño y habilitar la descarga o el uso
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
    </div>
  );
}
