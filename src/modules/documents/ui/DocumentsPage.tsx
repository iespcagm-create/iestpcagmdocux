import { Link } from 'react-router-dom';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { PageHeader } from '../../../shared/ui/PageHeader';

export function DocumentsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        description="Aquí se organizarán los documentos capturados, sus páginas y el historial local."
        eyebrow="Mis documentos"
        title="Tus documentos"
      />

      <EmptyState
        description="Todavía no existe almacenamiento de documentos en esta base. La captura, búsqueda e historial se habilitarán en las Subfases 1C a 1F."
        icon="folder"
        title="Todavía no hay documentos"
      >
        <Link className="button button--secondary" to="/panel">
          Volver al panel
        </Link>
      </EmptyState>
    </div>
  );
}
