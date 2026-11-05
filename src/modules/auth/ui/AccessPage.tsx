import { useNavigate } from 'react-router-dom';
import { useSession } from './sessionContext';
import { Brand } from '../../../shared/ui/Brand';
import { Icon } from '../../../shared/ui/Icon';
import { usePageTitle } from '../../../shared/ui/usePageTitle';

export function AccessPage() {
  const { startPreview } = useSession();
  const navigate = useNavigate();
  usePageTitle('Acceso');

  const handlePreview = () => {
    startPreview();
    navigate('/panel', { replace: true });
  };

  return (
    <main className="access-page" id="contenido-principal">
      <section className="access-card" aria-labelledby="access-title">
        <Brand variant="hero" />

        <p className="eyebrow">Fase 1A · Base del proyecto</p>
        <h1 id="access-title">Acceso local</h1>
        <p className="access-card__lead">
          Esta primera base permite revisar la estructura y el diseño de DOCUX.
          El registro y el inicio de sesión se implementarán en la Subfase 1B.
        </p>

        <div className="notice notice--info">
          <Icon name="info" size={20} />
          <p>
            La vista previa no es una autenticación. No se solicitan
            credenciales y la sesión se cierra al recargar la página.
          </p>
        </div>

        <button
          className="button button--primary button--wide"
          onClick={handlePreview}
          type="button"
        >
          Explorar la interfaz en modo vista previa
          <Icon name="arrow-right" size={20} />
        </button>

        <p className="access-card__footnote">
          DOCUX · Digitaliza. Gestiona. Avanza.
        </p>
      </section>
    </main>
  );
}
