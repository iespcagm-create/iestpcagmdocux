import { Link } from 'react-router-dom';
import { Icon } from '../../../shared/ui/Icon';
import { PageHeader } from '../../../shared/ui/PageHeader';

export function BackupPage() {
  return (
    <div className="page-stack">
      <PageHeader
        description="En la Fase 1 los documentos viven en este dispositivo. Descargarlos o compartirlos es la forma de conservar una copia externa."
        eyebrow="Copias y respaldo"
        title="Conserve sus documentos"
      />

      <section className="info-panel" aria-labelledby="backup-steps-title">
        <div className="info-panel__header">
          <span className="module-card__icon">
            <Icon name="backup" size={24} />
          </span>
          <div>
            <h2 id="backup-steps-title">Cómo guardar una copia externa</h2>
            <p>Tres pasos desde el mismo teléfono.</p>
          </div>
        </div>

        <ol className="backup-steps">
          <li>
            <strong>Escanee y genere el PDF.</strong>
            <span>
              Cada documento queda guardado temporalmente en IndexedDB dentro
              de este navegador.
            </span>
          </li>
          <li>
            <strong>Descargue o comparta.</strong>
            <span>
              Use los botones de la lista de documentos o del escáner para
              guardar el archivo PDF en el almacenamiento del teléfono.
            </span>
          </li>
          <li>
            <strong>Guarde una copia externa.</strong>
            <span>
              Adjunte el PDF en OneDrive, Google Drive, correo o WhatsApp. Si
              borra los datos del navegador, la copia local se pierde.
            </span>
          </li>
        </ol>

        <div className="backup-actions">
          <Link className="button button--primary" to="/documentos">
            Ver documentos recientes
          </Link>
          <Link className="button button--secondary" to="/escanear">
            Escanear documento
          </Link>
        </div>
      </section>

      <section className="info-strip" aria-label="Principio de respaldo">
        <Icon name="info" size={22} />
        <p>
          DOCUX, Fase 1 no envía documentos a ningún servicio en la nube. La
          copia externa depende de que usted descargue o comparta el PDF.
        </p>
      </section>
    </div>
  );
}
