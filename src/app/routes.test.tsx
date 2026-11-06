import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../test/renderRoute';

const protectedPages = [
  { path: '/panel', heading: 'Tu espacio de digitalización' },
  { path: '/escanear', heading: 'Escanear documento' },
  { path: '/documentos', heading: 'Documentos recientes' },
  { path: '/respaldos', heading: 'Conserve sus documentos' },
  { path: '/configuracion', heading: 'Configuración de DOCUX' },
];

describe('navegación y rutas protegidas de la Fase 1', () => {
  it('redirige al acceso cuando no existe una sesión válida', async () => {
    const { router } = renderRoute('/panel');

    expect(
      await screen.findByRole('heading', { name: 'Acceso local' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/acceso');
  });

  it.each(protectedPages)(
    'permite abrir $path con una sesión de Fase 1',
    async ({ path, heading }) => {
      const { router } = renderRoute(path, { authenticated: true });

      expect(
        await screen.findByRole('heading', { level: 1, name: heading }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(path);
    },
  );

  it('muestra un error con la contraseña incorrecta', async () => {
    const { user } = renderRoute('/acceso');

    await user.type(screen.getByLabelText('Contraseña'), '000');
    await user.click(screen.getByRole('button', { name: /Ingresar/i }));

    expect(
      await screen.findByText('Contraseña incorrecta'),
    ).toBeInTheDocument();
  });

  it('inicia la sesión con la contraseña 123 y abre el panel', async () => {
    const { router, store, user } = renderRoute('/acceso');

    await user.type(screen.getByLabelText('Contraseña'), '123');
    await user.click(screen.getByRole('button', { name: /Ingresar/i }));

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Tu espacio de digitalización',
      }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/panel');
    expect(store.getSnapshot()?.kind).toBe('phase1');
  });

  it('navega entre los módulos desde la barra principal', async () => {
    const { user } = renderRoute('/panel', { authenticated: true });

    await user.click(screen.getByRole('link', { name: 'Escanear' }));

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Escanear documento',
      }),
    ).toBeInTheDocument();
  });

  it('cierra la sesión y vuelve al acceso', async () => {
    const { router, store, user } = renderRoute('/panel', {
      authenticated: true,
    });

    const [logout] = screen.getAllByRole('button', {
      name: 'Cerrar sesión',
    });
    await user.click(logout);

    expect(
      await screen.findByRole('heading', { name: 'Acceso local' }),
    ).toBeInTheDocument();
    expect(store.getSnapshot()).toBeNull();
    expect(router.state.location.pathname).toBe('/acceso');
  });

  it('muestra una página 404 comprensible', async () => {
    const { router } = renderRoute('/ruta-inexistente', {
      authenticated: true,
    });

    expect(
      await screen.findByRole('heading', { name: 'Esta página no existe' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/ruta-inexistente');
  });
});
