import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import {
  displayedImageRect,
  fallbackQuad,
  imagePointToDisplay,
  isConvexQuad,
  screenPointToImage,
  signedQuadArea,
  type Quad,
} from '../domain/documentGeometry';
import { detectDocumentFromBlob } from '../infrastructure/documentDetection';
import { canvasToJpeg, yieldToBrowser } from '../infrastructure/image';
import {
  PAGE_FILTERS,
  applyFilterToCanvas,
  processPageImage,
  type PageFilter,
} from '../infrastructure/imageFilters';
import {
  getLoadedOpenCv,
  loadOpenCv,
} from '../infrastructure/opencv';
import { warpDocumentToCanvas } from '../infrastructure/perspective';
import { useObjectUrl } from '../../../shared/utils/useObjectUrl';

export interface PendingCapture {
  blob: Blob;
  width: number;
  height: number;
  targetIndex: number | null;
}

interface DocumentEditorProps {
  capture: PendingCapture;
  onConfirm: (blob: Blob) => void;
  onRetake: () => void;
}

type ProcessingStage = 'idle' | 'warping' | 'filtering';

const CORNER_NAMES = [
  'superior izquierda',
  'superior derecha',
  'inferior derecha',
  'inferior izquierda',
];

const MAGNIFIER_SIZE = 112;
const MAGNIFIER_ZOOM = 2.4;

function polygonPoints(corners: Quad): string {
  return corners.map((point) => `${point.x},${point.y}`).join(' ');
}

export function DocumentEditor({
  capture,
  onConfirm,
  onRetake,
}: DocumentEditorProps) {
  const sourceUrl = useObjectUrl(capture.blob);
  const stageRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previewUrlRef = useRef('');
  const mountedRef = useRef(true);
  const userAdjustedRef = useRef(false);
  const dragRef = useRef<{ index: number; pointerId: number } | null>(null);
  const [corners, setCorners] = useState<Quad>(() =>
    fallbackQuad(capture.width, capture.height),
  );
  const [initialCorners, setInitialCorners] = useState<Quad>(() =>
    fallbackQuad(capture.width, capture.height),
  );
  const [filter, setFilter] = useState<PageFilter>('document');
  const [status, setStatus] = useState('Detectando documento');
  const [detecting, setDetecting] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewBusy, setPreviewBusy] = useState(true);
  const [processing, setProcessing] = useState<ProcessingStage>('idle');
  const [activeCorner, setActiveCorner] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    mountedRef.current = true;
    dialogRef.current?.focus({ preventScroll: true });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      mountedRef.current = false;
      document.body.style.overflow = previousOverflow;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = '';
      }
    };
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    const updateSize = () => {
      const rect = stage.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateSize)
        : null;
    observer?.observe(stage);
    window.addEventListener('resize', updateSize);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const displayRect = useMemo(
    () =>
      displayedImageRect(
        stageSize.width,
        stageSize.height,
        capture.width,
        capture.height,
      ),
    [capture.height, capture.width, stageSize.height, stageSize.width],
  );

  const detect = useCallback(
    async (applyToCurrent: boolean) => {
      setDetecting(true);
      setError('');
      setStatus('Detectando documento');

      try {
        const cv = await loadOpenCv();
        const result = await detectDocumentFromBlob(capture.blob, cv);

        if (!mountedRef.current) {
          return;
        }

        if (result) {
          setInitialCorners(result.corners);

          if (applyToCurrent || !userAdjustedRef.current) {
            setCorners(result.corners);
            userAdjustedRef.current = false;
          }

          setStatus(
            'Documento detectado. Arrastre las esquinas si es necesario.',
          );
        } else {
          const fallback = fallbackQuad(capture.width, capture.height);

          if (applyToCurrent) {
            setCorners(fallback);
            setInitialCorners(fallback);
            userAdjustedRef.current = false;
          }

          setStatus(
            'No se detectaron cuatro esquinas. Ajuste manualmente.',
          );
        }
      } catch {
        if (mountedRef.current) {
          setStatus(
            'Detección automática no disponible. Ajuste las esquinas manualmente.',
          );
        }
      } finally {
        if (mountedRef.current) {
          setDetecting(false);
        }
      }
    },
    [capture.blob, capture.height, capture.width],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void detect(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [detect]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (cancelled) {
          return;
        }

        setPreviewBusy(true);

        try {
          const cv = getLoadedOpenCv();
          const preview = await processPageImage(capture.blob, corners, {
            cv,
            filter,
            maxSide: 560,
            quality: 0.84,
          });

          if (cancelled || !mountedRef.current) {
            return;
          }

          const url = URL.createObjectURL(preview);
          if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
          }
          previewUrlRef.current = url;
          setPreviewUrl(url);
        } catch {
          if (mountedRef.current && !cancelled) {
            setPreviewBusy(false);
          }
        } finally {
          if (mountedRef.current && !cancelled) {
            setPreviewBusy(false);
          }
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [capture.blob, corners, filter]);

  const commitCorner = useCallback((index: number, point: { x: number; y: number }) => {
    setCorners((current) => {
      const next: Quad = [...current] as Quad;
      next[index] = point;

      if (
        signedQuadArea(next) <= 0 ||
        !isConvexQuad(next, 6)
      ) {
        return current;
      }

      return next;
    });
    userAdjustedRef.current = true;
  }, []);

  const updateFromPointer = useCallback(
    (index: number, clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage) {
        return;
      }

      const rect = stage.getBoundingClientRect();
      const point = screenPointToImage(
        clientX,
        clientY,
        rect,
        capture.width,
        capture.height,
      );
      commitCorner(index, point);
    },
    [capture.height, capture.width, commitCorner],
  );

  const handlePointerDown =
    (index: number) => (event: PointerEvent<HTMLButtonElement>) => {
      if (processing !== 'idle') {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = { index, pointerId: event.pointerId };
      setActiveCorner(index);
      updateFromPointer(index, event.clientX, event.clientY);
    };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    updateFromPointer(drag.index, event.clientX, event.clientY);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    setActiveCorner(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown =
    (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
      const amount = event.shiftKey ? 10 : 2;
      let deltaX = 0;
      let deltaY = 0;

      if (event.key === 'ArrowLeft') {
        deltaX = -amount;
      } else if (event.key === 'ArrowRight') {
        deltaX = amount;
      } else if (event.key === 'ArrowUp') {
        deltaY = -amount;
      } else if (event.key === 'ArrowDown') {
        deltaY = amount;
      } else {
        return;
      }

      event.preventDefault();
      const current = corners[index];
      commitCorner(index, {
        x: Math.min(capture.width - 1, Math.max(0, current.x + deltaX)),
        y: Math.min(capture.height - 1, Math.max(0, current.y + deltaY)),
      });
    };

  const handleConfirm = async () => {
    if (processing !== 'idle') {
      return;
    }

    if (signedQuadArea(corners) <= 0 || !isConvexQuad(corners, 8)) {
      setError('Las esquinas no forman un área válida. Ajuste nuevamente.');
      return;
    }

    setError('');
    setProcessing('warping');
    setStatus('Corrigiendo perspectiva');

    try {
      await yieldToBrowser();
      const cv = getLoadedOpenCv();
      const canvas = await warpDocumentToCanvas(capture.blob, corners, {
        cv,
        maxSide: 2400,
      });

      if (!mountedRef.current) {
        return;
      }

      setProcessing('filtering');
      setStatus('Preparando página');
      await yieldToBrowser();
      applyFilterToCanvas(canvas, filter, cv);
      const blob = await canvasToJpeg(canvas, 0.92);

      if (mountedRef.current) {
        onConfirm(blob);
      }
    } catch {
      if (mountedRef.current) {
        setError(
          'No se pudo preparar la página. Vuelva a intentarlo o repita la foto.',
        );
        setStatus('Ajuste las esquinas y confirme nuevamente.');
      }
    } finally {
      if (mountedRef.current) {
        setProcessing('idle');
      }
    }
  };

  const handleRedetect = () => {
    userAdjustedRef.current = false;
    void detect(true);
  };

  const handleReset = () => {
    setCorners(initialCorners);
    userAdjustedRef.current = false;
    setStatus('Esquinas restablecidas. Ajuste si es necesario.');
    setError('');
  };

  const handleFullImage = () => {
    setCorners([
      { x: 0, y: 0 },
      { x: capture.width - 1, y: 0 },
      { x: capture.width - 1, y: capture.height - 1 },
      { x: 0, y: capture.height - 1 },
    ]);
    userAdjustedRef.current = true;
    setStatus('Se usará la imagen completa. Confirme el recorte.');
    setError('');
  };

  const activePoint =
    activeCorner !== null ? corners[activeCorner] : null;
  const activeDisplay = activePoint
    ? imagePointToDisplay(
        activePoint,
        stageSize.width,
        stageSize.height,
        capture.width,
        capture.height,
      )
    : null;
  const scale = displayRect.width / Math.max(1, capture.width);
  const magnifierLeft = activeDisplay
    ? Math.min(
        Math.max(
          8,
          activeDisplay.x +
            (activeDisplay.x > stageSize.width / 2 ? -86 : 86) -
            MAGNIFIER_SIZE / 2,
        ),
        Math.max(8, stageSize.width - MAGNIFIER_SIZE - 8),
      )
    : 0;
  const magnifierTop = activeDisplay
    ? Math.min(
        Math.max(8, activeDisplay.y - MAGNIFIER_SIZE - 26),
        Math.max(8, stageSize.height - MAGNIFIER_SIZE - 8),
      )
    : 0;

  const processingMessage =
    processing === 'warping'
      ? 'Corrigiendo perspectiva'
      : processing === 'filtering'
        ? 'Preparando página'
        : '';

  return (
    <div
      aria-labelledby="doc-editor-title"
      aria-modal="true"
      className="doc-editor"
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <header className="doc-editor__header">
        <div>
          <p className="eyebrow">Paso 2 de 2</p>
          <h2 id="doc-editor-title">Ajustar documento</h2>
        </div>
        <span className="tag tag--soft-dark">A4</span>
      </header>

      <div className="doc-editor__stage" ref={stageRef}>
        {displayRect.width > 0 ? (
          <>
            <img
              alt="Fotografía completa del documento"
              className="doc-editor__photo"
              src={sourceUrl}
              style={{
                left: displayRect.x,
                top: displayRect.y,
                width: displayRect.width,
                height: displayRect.height,
              }}
            />

            <svg
              aria-hidden="true"
              className="doc-editor__overlay"
              preserveAspectRatio="none"
              style={{
                left: displayRect.x,
                top: displayRect.y,
                width: displayRect.width,
                height: displayRect.height,
              }}
              viewBox={`0 0 ${capture.width} ${capture.height}`}
            >
              <path
                d={`M0 0 H ${capture.width} V ${capture.height} H 0 Z ${polygonPoints(
                  corners,
                )} Z`}
                fill="rgb(2 10 20 / 52%)"
                fillRule="evenodd"
              />
              <polygon
                fill="rgb(9 105 218 / 12%)"
                points={polygonPoints(corners)}
                stroke="#5eead4"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {corners.map((point, index) => {
              const position = imagePointToDisplay(
                point,
                stageSize.width,
                stageSize.height,
                capture.width,
                capture.height,
              );

              return (
                <button
                  aria-label={`Esquina ${index + 1}: ${CORNER_NAMES[index]}`}
                  className={`doc-editor__handle${
                    activeCorner === index
                      ? ' doc-editor__handle--active'
                      : ''
                  }`}
                  key={CORNER_NAMES[index]}
                  onKeyDown={handleKeyDown(index)}
                  onLostPointerCapture={() => {
                    dragRef.current = null;
                    setActiveCorner(null);
                  }}
                  onPointerDown={handlePointerDown(index)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  style={{ left: position.x, top: position.y }}
                  type="button"
                >
                  {index + 1}
                </button>
              );
            })}

            {activePoint && activeDisplay ? (
              <div
                aria-hidden="true"
                className="doc-editor__magnifier"
                style={{
                  left: magnifierLeft,
                  top: magnifierTop,
                  backgroundImage: `url(${sourceUrl})`,
                  backgroundPosition: `${
                    -activePoint.x * scale * MAGNIFIER_ZOOM +
                    MAGNIFIER_SIZE / 2
                  }px ${
                    -activePoint.y * scale * MAGNIFIER_ZOOM +
                    MAGNIFIER_SIZE / 2
                  }px`,
                  backgroundSize: `${
                    displayRect.width * MAGNIFIER_ZOOM
                  }px ${displayRect.height * MAGNIFIER_ZOOM}px`,
                }}
              >
                <span className="doc-editor__magnifier-cross" />
              </div>
            ) : null}
          </>
        ) : null}

        <p aria-live="polite" className="doc-editor__status" role="status">
          {detecting ? 'Detectando documento' : status}
        </p>
      </div>

      <div className="doc-editor__panel">
        <div className="doc-editor__preview-row">
          <div className="doc-editor__preview-frame">
            {previewUrl ? (
              <img alt="Vista previa de la página corregida" src={previewUrl} />
            ) : (
              <span className="camera-overlay__spinner" aria-hidden="true" />
            )}
            {previewBusy ? (
              <span className="doc-editor__preview-busy">
                Actualizando…
              </span>
            ) : null}
          </div>

          <div className="doc-editor__preview-copy">
            <p className="eyebrow">Vista previa</p>
            <p>
              Arrastre los puntos 1 a 4 hasta los bordes del papel. La mesa y
              el fondo se eliminan al confirmar.
            </p>
            {previewBusy ? (
              <p className="field-hint">Actualizando vista previa…</p>
            ) : null}
            {error ? (
              <p className="field-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <div
          aria-label="Filtro de la página"
          className="doc-editor__filters"
          role="group"
        >
          {PAGE_FILTERS.map((option) => (
            <button
              aria-pressed={filter === option.id}
              className={`doc-editor__filter${
                filter === option.id
                  ? ' doc-editor__filter--active'
                  : ''
              }`}
              disabled={processing !== 'idle'}
              key={option.id}
              onClick={() => setFilter(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="doc-editor__actions">
          <button
            className="button button--secondary"
            disabled={detecting || processing !== 'idle'}
            onClick={handleRedetect}
            type="button"
          >
            Detectar nuevamente
          </button>
          <button
            className="button button--secondary"
            disabled={detecting || processing !== 'idle'}
            onClick={handleReset}
            type="button"
          >
            Restablecer
          </button>
          <button
            className="button button--secondary"
            disabled={processing !== 'idle'}
            onClick={handleFullImage}
            type="button"
          >
            Usar imagen completa
          </button>
          <button
            className="button button--secondary"
            disabled={processing !== 'idle'}
            onClick={onRetake}
            type="button"
          >
            Repetir foto
          </button>
          <button
            className="button button--primary doc-editor__confirm"
            disabled={processing !== 'idle'}
            onClick={() => void handleConfirm()}
            type="button"
          >
            Confirmar recorte
          </button>
        </div>
      </div>

      {processing !== 'idle' ? (
        <div
          aria-live="assertive"
          className="doc-editor__processing"
          role="status"
        >
          <span className="camera-overlay__spinner" aria-hidden="true" />
          <strong>{processingMessage}</strong>
        </div>
      ) : null}
    </div>
  );
}
