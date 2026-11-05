import { Link } from 'react-router-dom';
import { Icon } from '../../shared/ui/Icon';
import { usePageTitle } from '../../shared/ui/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Página no encontrada');

  return (
    <main className="standalone-page" id="contenido-principal">
      <section className="error-card">
        <span className="error-card__icon">
          <Icon name="info" size={30} />
        </span>
        <p className="eyebrow">Error 404</p>
        <h1>Esta página no existe</h1>
        <p>
          La dirección no corresponde a ninguna pantalla de DOCUX. Puede volver
          al inicio de la aplicación.
        </p>
        <Link className="button button--primary" to="/">
          Volver al inicio
          <Icon name="arrow-right" size={20} />
        </Link>
      </section>
    </main>
  );
}
