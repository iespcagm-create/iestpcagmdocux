import { Link } from 'react-router-dom';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { Icon } from '../../../shared/ui/Icon';
import { PageHeader } from '../../../shared/ui/PageHeader';

export function ScannerPage() {
  return (
    <div className="page-stack">
      <PageHeader
        description="La captura manual se integrará en la siguiente etapa de la Fase 1, con permisos y estados claramente explicados."
        eyebrow="Escanear"
        title="Escanear documento"
      />

      <EmptyState
        description="La vista previa de cámara, los perfiles de resolución y la captura de páginas se habilitarán en la Subfase 1C. Todavía no se solicita acceso a la cámara."
        icon="camera"
        title="La cámara aún no está activa"
      >
        <Link className="button button--secondary" to="/panel">
          Volver al panel
        </Link>
      </EmptyState>

      <section className="info-strip" aria-label="Qué incluirá el escáner">
        <Icon name="shield" size={22} />
        <p>
          Cuando se active, pedirá permiso antes de encender la cámara y
          liberará el dispositivo al salir de la pantalla.
        </p>
      </section>
    </div>
  );
}
