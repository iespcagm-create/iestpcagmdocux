import { Link } from 'react-router-dom';
import { Icon } from '../../shared/ui/Icon';
import { PageHeader } from '../../shared/ui/PageHeader';

const modules = [
  {
    to: '/documentos',
    icon: 'documents' as const,
    title: 'Mis documentos',
    description:
      'Consulta y organiza los documentos capturados. La vista tomará datos locales en la Subfase 1D.',
    badge: 'Planificado',
  },
  {
    to: '/respaldos',
    icon: 'backup' as const,
    title: 'Copias de seguridad',
    description:
      'Exporta e importa un respaldo validado. La función se habilitará en la Subfase 1F.',
    badge: 'Planificado',
  },
  {
    to: '/configuracion',
    icon: 'settings' as const,
    title: 'Configuración',
    description:
      'Revisa las decisiones de esta base. Los ajustes editables se incorporarán más adelante.',
    badge: 'Base',
  },
];

const statusItems = [
  'Navegación, diseño adaptable y manejo de errores.',
  'Acceso local con contraseña y recuperación.',
  'Cámara y captura manual de páginas.',
  'Documentos, páginas, PDF, historial y respaldos.',
  'Instalación PWA, funcionamiento sin conexión y validación final.',
];

export function PanelPage() {
  return (
    <div className="page-stack">
      <PageHeader
        description="Esta es la base visual de la Fase 1A. Puedes recorrer todas las pantallas; las funciones se habilitarán en las subfases siguientes."
        eyebrow="Panel"
        title="Tu espacio de digitalización"
      />

      <section className="welcome-card" aria-labelledby="welcome-title">
        <div className="welcome-card__copy">
          <span className="tag tag--soft">Base 1A</span>
          <h2 id="welcome-title">Preparado para digitalizar</h2>
          <p>
            La pantalla de escaneo ya forma parte de la navegación. La cámara y
            la captura manual se activarán en la Subfase 1C.
          </p>
        </div>
        <Link className="button button--light" to="/escanear">
          Abrir pantalla de escaneo
          <Icon name="arrow-right" size={20} />
        </Link>
        <div className="welcome-card__decoration" aria-hidden="true">
          <Icon name="scan" size={124} />
        </div>
      </section>

      <section aria-labelledby="modules-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Accesos</p>
            <h2 id="modules-title">Módulos principales</h2>
          </div>
          <p>Navegación disponible en esta base.</p>
        </div>

        <div className="module-grid">
          {modules.map((module) => (
            <Link
              className="module-card"
              key={module.to}
              to={module.to}
            >
              <span className="module-card__icon">
                <Icon name={module.icon} size={24} />
              </span>
              <span className="tag tag--muted">{module.badge}</span>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <span className="module-card__link">
                Abrir pantalla
                <Icon name="arrow-right" size={18} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="status-panel" aria-labelledby="status-title">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="eyebrow">Ruta de la Fase 1</p>
            <h2 id="status-title">Estado del proyecto</h2>
          </div>
          <span className="tag tag--preview">Vista previa</span>
        </div>

        <ol className="status-list">
          {statusItems.map((item, index) => (
            <li key={item}>
              <span
                aria-hidden="true"
                className={`status-list__marker${
                  index === 0 ? ' status-list__marker--done' : ''
                }`}
              >
                {index === 0 ? <Icon name="check" size={15} /> : index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <p className="status-panel__note">
          Esta vista no sustituye las funciones pendientes ni representa datos
          reales.
        </p>
      </section>
    </div>
  );
}
