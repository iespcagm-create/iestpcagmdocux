import { Icon } from '../../../shared/ui/Icon';
import { PageHeader } from '../../../shared/ui/PageHeader';

const settings = [
  { label: 'Versión', value: 'DOCUX, Fase 1' },
  { label: 'Acceso', value: 'Contraseña provisional' },
  { label: 'Sesión', value: 'sessionStorage (se pierde al cerrar la pestaña)' },
  { label: 'Documentos', value: 'IndexedDB local (docux-phase1)' },
  { label: 'PDF', value: 'A4 multipágina generado en el navegador' },
  { label: 'Voz', value: 'Español (es-PE), desactivable en el escáner' },
  { label: 'Cámara', value: 'Cámara posterior cuando está disponible' },
];

export function SettingsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        description="Características de esta entrega y su alcance real."
        eyebrow="Configuración"
        title="Configuración de DOCUX"
      />

      <section className="info-panel" aria-labelledby="settings-title">
        <div className="info-panel__header">
          <span className="module-card__icon">
            <Icon name="settings" size={24} />
          </span>
          <div>
            <h2 id="settings-title">Valores de la Fase 1</h2>
            <p>Información de referencia. Los ajustes se editan en el escáner.</p>
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
          <h2 id="security-title">Acceso provisional</h2>
          <p>
            La contraseña de la Fase 1 es una protección de acceso básica, no
            seguridad de producción. No hay backend, cifrado de documentos ni
            sincronización remota. Los PDF se guardan en el almacenamiento del
            navegador de este dispositivo.
          </p>
        </div>
      </section>
    </div>
  );
}
