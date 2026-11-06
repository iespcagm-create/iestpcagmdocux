import { Link } from 'react-router-dom';
import { Icon } from '../../shared/ui/Icon';
import { PageHeader } from '../../shared/ui/PageHeader';

const modules = [
  {
    to: '/escanear',
    icon: 'scan' as const,
    title: 'Escanear documento',
    description:
      'Capture páginas con la cámara posterior en modo manual o automático y genere un PDF.',
  },
  {
    to: '/documentos',
    icon: 'documents' as const,
    title: 'Documentos recientes',
    description:
      'Consulte, descargue, comparta o elimine los PDF guardados en este dispositivo.',
  },
  {
    to: '/respaldos',
    icon: 'backup' as const,
    title: 'Copias y respaldo',
    description:
      'Aprenda a conservar una copia externa de sus documentos desde el mismo dispositivo.',
  },
  {
    to: '/configuracion',
    icon: 'settings' as const,
    title: 'Configuración',
    description:
      'Revise cómo funciona el acceso provisional, el almacenamiento local y los avisos de voz.',
  },
];

const completedItems = [
  'Acceso provisional con sesión en sessionStorage.',
  'Captura real con la cámara posterior y guía de encuadre.',
  'Modo manual y modo automático básico por estabilidad.',
  'Voz en español, sonido de captura y avisos configurables.',
  'Páginas numeradas con vista, reemplazo, giro y orden.',
  'PDF A4 multipágina, descarga y uso compartido.',
  'Documentos recientes guardados en IndexedDB.',
];

export function PanelPage() {
  return (
    <div className="page-stack">
      <PageHeader
        description="DOCUX, Fase 1. Escanee, organice y genere PDF directamente en este dispositivo."
        eyebrow="Panel"
        title="Tu espacio de digitalización"
      />

      <section className="welcome-card" aria-labelledby="welcome-title">
        <div className="welcome-card__copy">
          <span className="tag tag--soft">Fase 1</span>
          <h2 id="welcome-title">Escanee su primera página</h2>
          <p>
            La cámara se abre en el escáner. Capture una o varias páginas,
            revise el orden y genere un PDF A4 para descargarlo o compartirlo.
          </p>
        </div>
        <Link className="button button--light" to="/escanear">
          Abrir escáner
          <Icon name="arrow-right" size={20} />
        </Link>
        <div aria-hidden="true" className="welcome-card__decoration">
          <Icon name="scan" size={124} />
        </div>
      </section>

      <section aria-labelledby="modules-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Accesos</p>
            <h2 id="modules-title">Módulos de la Fase 1</h2>
          </div>
          <p>Funciones disponibles en esta entrega.</p>
        </div>

        <div className="module-grid">
          {modules.map((module) => (
            <Link className="module-card" key={module.to} to={module.to}>
              <span className="module-card__icon">
                <Icon name={module.icon} size={24} />
              </span>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <span className="module-card__link">
                Abrir
                <Icon name="arrow-right" size={18} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="status-panel" aria-labelledby="status-title">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="eyebrow">Fase 1</p>
            <h2 id="status-title">Funciones terminadas</h2>
          </div>
          <span className="tag tag--muted">Disponible</span>
        </div>

        <ol className="status-list">
          {completedItems.map((item) => (
            <li key={item}>
              <span
                aria-hidden="true"
                className="status-list__marker status-list__marker--done"
              >
                <Icon name="check" size={15} />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <p className="status-panel__note">
          El modo automático usa detección básica de estabilidad; no incluye
          reconocimiento de bordes, corrección de perspectiva ni OCR.
        </p>
      </section>
    </div>
  );
}
