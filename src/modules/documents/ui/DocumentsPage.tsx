import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../../shared/ui/Icon';
import { PageHeader } from '../../../shared/ui/PageHeader';
import {
  downloadBlob,
  formatBytes,
  formatDateTime,
  sharePdf,
} from '../../../shared/utils/files';
import {
  deleteDocument,
  listDocuments,
  type StoredDocument,
} from '../infrastructure/indexedDb';

const SHARE_FALLBACK =
  'PDF descargado. Puede adjuntarlo en OneDrive, Google Drive, correo o WhatsApp';

export function DocumentsPage() {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    listDocuments()
      .then((storedDocuments) => {
        if (!active) {
          return;
        }

        setDocuments(storedDocuments);
        setLoading(false);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setError(
          'No se pudieron leer los documentos de este dispositivo. Compruebe que el navegador permite IndexedDB.',
        );
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const handleRetry = () => {
    setLoading(true);
    setError('');
    setReloadToken((current) => current + 1);
  };

  const handleDownload = (document: StoredDocument) => {
    downloadBlob(document.pdfBlob, document.name);
    setMessage('PDF descargado.');
  };

  const handleShare = async (document: StoredDocument) => {
    setMessage('');
    setBusyId(document.id);

    try {
      const result = await sharePdf(document.pdfBlob, document.name);

      if (result === 'downloaded') {
        setMessage(SHARE_FALLBACK);
      } else if (result === 'shared') {
        setMessage('PDF compartido.');
      }
    } catch {
      setMessage(
        'No se pudo compartir el PDF. Puede descargarlo y adjuntarlo manualmente.',
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    setBusyId(documentId);

    try {
      await deleteDocument(documentId);
      setDocuments((current) =>
        current.filter((document) => document.id !== documentId),
      );
      setConfirmId(null);
      setMessage('Documento eliminado de este dispositivo.');
    } catch {
      setMessage('No se pudo eliminar el documento. Inténtelo de nuevo.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        description="Documentos guardados en este dispositivo durante la Fase 1."
        eyebrow="Mis documentos"
        title="Documentos recientes"
        actions={
          <Link className="button button--primary" to="/escanear">
            <Icon name="camera" size={20} />
            Escanear documento
          </Link>
        }
      />

      <p className="documents-warning">
        <Icon name="info" size={18} />
        Los documentos están guardados en este dispositivo. Descárguelos o
        compártalos para conservar una copia externa
      </p>

      {message ? (
        <p className="field-success" role="status">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="documents-status" role="status">
          Leyendo documentos guardados…
        </p>
      ) : null}

      {error ? (
        <div className="notice notice--info" role="alert">
          <Icon name="info" size={20} />
          <div>
            <p>{error}</p>
            <button
              className="button button--secondary button--small"
              onClick={handleRetry}
              type="button"
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : null}

      {!loading && !error && documents.length === 0 ? (
        <section className="empty-state" aria-labelledby="empty-title">
          <div className="empty-state__icon">
            <Icon name="folder" size={28} />
          </div>
          <div className="empty-state__copy">
            <h2 id="empty-title">Todavía no hay documentos guardados</h2>
            <p>
              Escanee una o varias páginas, genere el PDF y aparecerá en esta
              lista para descargarlo o compartirlo.
            </p>
          </div>
          <div className="empty-state__actions">
            <Link className="button button--primary" to="/escanear">
              Abrir escáner
              <Icon name="arrow-right" size={18} />
            </Link>
          </div>
        </section>
      ) : null}

      {documents.length > 0 ? (
        <ul className="document-list">
          {documents.map((document) => (
            <li className="document-card" key={document.id}>
              <div className="document-card__main">
                <span className="document-card__icon">
                  <Icon name="documents" size={22} />
                </span>
                <div className="document-card__copy">
                  <h2>{document.name}</h2>
                  <p>
                    {formatDateTime(document.createdAt)} · {document.pageCount}{' '}
                    {document.pageCount === 1 ? 'página' : 'páginas'} ·{' '}
                    {formatBytes(document.size)}
                  </p>
                </div>
              </div>

              {confirmId === document.id ? (
                <div className="document-card__confirm" role="group">
                  <p>¿Eliminar este documento del dispositivo?</p>
                  <div className="document-card__actions">
                    <button
                      className="button button--danger button--small"
                      disabled={busyId === document.id}
                      onClick={() => void handleDelete(document.id)}
                      type="button"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      className="button button--secondary button--small"
                      onClick={() => setConfirmId(null)}
                      type="button"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="document-card__actions">
                  <button
                    className="button button--secondary button--small"
                    onClick={() => handleDownload(document)}
                    type="button"
                  >
                    Descargar
                  </button>
                  <button
                    className="button button--secondary button--small"
                    disabled={busyId === document.id}
                    onClick={() => void handleShare(document)}
                    type="button"
                  >
                    Compartir
                  </button>
                  <button
                    className="button button--danger button--small"
                    onClick={() => {
                      setConfirmId(document.id);
                      setMessage('');
                    }}
                    type="button"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="documents-footnote">
        DOCUX, Fase 1 · Digitaliza. Gestiona. Avanza.
      </p>
    </div>
  );
}
