import { Link } from 'react-router-dom';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { Icon } from '../../../shared/ui/Icon';
import { PageHeader } from '../../../shared/ui/PageHeader';

export function BackupPage() {
  return (
    <div className="page-stack">
      <PageHeader
        description="Las copias de seguridad serán archivos locales con versión de esquema, validación e integridad."
        eyebrow="Copias de seguridad"
        title="Protege tus datos locales"
      />

      <EmptyState
        description="La exportación, validación e importación se implementarán en la Subfase 1F. En esta base no hay datos que guardar todavía."
        icon="backup"
        title="Aún no hay copias para administrar"
      >
        <Link className="button button--secondary" to="/panel">
          Volver al panel
        </Link>
      </EmptyState>

      <section className="info-strip" aria-label="Principio de respaldo">
        <Icon name="info" size={22} />
        <p>
          El respaldo se guardará en el dispositivo y contendrá datos locales.
          No se enviará automáticamente a ningún servicio en la nube.
        </p>
      </section>
    </div>
  );
}
