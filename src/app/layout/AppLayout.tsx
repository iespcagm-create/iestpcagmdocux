import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../../modules/auth/ui/sessionContext';
import { Brand } from '../../shared/ui/Brand';
import { Icon } from '../../shared/ui/Icon';
import { getPageLabel, navigationItems } from '../navigation';

export function AppLayout() {
  const { endSession } = useSession();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const pageLabel = getPageLabel(location.pathname);

  useEffect(() => {
    document.title = `${pageLabel} · DOCUX`;
    mainRef.current?.focus({ preventScroll: true });
  }, [pageLabel]);

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#contenido-principal"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Saltar al contenido
      </a>

      <aside className="app-sidebar" aria-label="Barra de navegación">
        <div className="app-sidebar__brand">
          <Brand />
        </div>

        <nav className="app-nav" aria-label="Navegación principal">
          {navigationItems.map((item) => (
            <NavLink
              aria-label={item.label}
              className={({ isActive }) =>
                `app-nav__link${isActive ? ' app-nav__link--active' : ''}`
              }
              key={item.to}
              to={item.to}
            >
              <Icon className="app-nav__icon" name={item.icon} size={21} />
              <span className="nav-label nav-label--full">{item.label}</span>
              <span className="nav-label nav-label--short">
                {item.shortLabel}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar__footer">
          <p>DOCUX · Fase 1</p>
          <p>Los documentos permanecen en este dispositivo.</p>
          <button
            className="button button--sidebar"
            onClick={endSession}
            type="button"
          >
            <Icon name="logout" size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="app-main-shell">
        <header className="mobile-header">
          <div className="mobile-brand">
            <span className="mobile-brand__name">DOCUX</span>
            <span className="mobile-brand__tagline">
              Digitaliza. Gestiona. Avanza.
            </span>
          </div>
          <div className="mobile-header__actions">
            <span className="tag tag--phase">Fase 1</span>
            <button
              aria-label="Cerrar sesión"
              className="mobile-logout"
              onClick={endSession}
              title="Cerrar sesión"
              type="button"
            >
              <Icon name="logout" size={19} />
              <span aria-hidden="true">Salir</span>
            </button>
          </div>
        </header>

        <p
          aria-atomic="true"
          aria-live="polite"
          className="sr-only"
          role="status"
        >
          Página {pageLabel}
        </p>

        <main
          className="app-content"
          id="contenido-principal"
          ref={mainRef}
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
