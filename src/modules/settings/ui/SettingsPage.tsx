import { Icon } from '../../../shared/ui/Icon';
import { PageHeader } from '../../../shared/ui/PageHeader';

const settings = [
  { label: 'Tema', value: 'Claro' },
  { label: 'Idioma', value: 'Español' },
  { label: 'Almacenamiento previsto', value: 'IndexedDB local' },
  { label: 'Sesión', value: 'Se implementará en la Subfase 1B' },
  { label: 'Respaldo', value: 'Se implementará en la Subfase 1F' },
  { label: 'Instalación', value: 'PWA, prevista para la Subfase 1G' },
];

export function SettingsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        description="Decisiones iniciales de la base. En esta entrega todavía no hay ajustes editables."
        eyebrow="Configuración"
        title="Configuración de DOCUX"
      />

      <section className="info-panel" aria-labelledby="settings-title">
        <div className="info-panel__header">
          <span className="module-card__icon">
            <Icon name="settings" size={24} />
          </span>
          <div>
            <h2 id="settings-title">Valores de esta base</h2>
            <p>Información de referencia, no configurable en 1A.</p>
          </div>
        </div>

        <dl className="detail-list">
          {settings.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="notice notice--info" aria-labelledby="security-title">
        <Icon name="lock" size={22} />
        <div>
          <h2 id="security-title">Privacidad local</h2>
          <p>
            DOCUX no tendrá backend ni sincronización en la Fase 1. La
            autenticación local protegerá el acceso casual, pero no equivale a
            cifrado del dispositivo. Esta diferencia se documentará antes de
            habilitar el acceso real.
          </p>
        </div>
      </section>
    </div>
  );
}
