import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../test/renderRoute';

const protectedPages = [
  { path: '/panel', heading: 'Tu espacio de digitalización' },
  { path: '/escanear', heading: 'Escanear documento' },
  { path: '/documentos', heading: 'Tus documentos' },
  { path: '/respaldos', heading: 'Protege tus datos locales' },
  { path: '/configuracion', heading: 'Configuración de DOCUX' },
];

describe('navegación y rutas protegidas de la Subfase 1A', () => {
  it('redirige al acceso cuando no existe una sesión válida', async () => {
    const { router } = renderRoute('/panel');

    expect(
      await screen.findByRole('heading', { name: 'Acceso local' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/acceso');
  });

  it.each(protectedPages)(
    'permite abrir $path solo con la sesión de vista previa',
    async ({ path, heading }) => {
      const { router } = renderRoute(path, { preview: true });

      expect(
        await screen.findByRole('heading', { level: 1, name: heading }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(path);
      expect(
        screen.getByRole('note', { name: 'Aviso de modo vista previa' }),
      ).toBeInTheDocument();
    },
  );

  it('inicia la vista previa desde el acceso y abre el panel', async () => {
    const { router, store, user } = renderRoute('/acceso');

    await user.click(
      screen.getByRole('button', {
        name: /Explorar la interfaz en modo vista previa/i,
      }),
    );

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Tu espacio de digitalización',
      }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/panel');
    expect(store.getSnapshot()?.kind).toBe('preview');
  });

  it('navega entre los módulos desde la barra principal', async () => {
    const { user } = renderRoute('/panel', { preview: true });

    await user.click(screen.getByRole('link', { name: 'Escanear' }));

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Escanear documento',
      }),
    ).toBeInTheDocument();
  });

  it('cierra la vista previa y vuelve al acceso', async () => {
    const { router, store, user } = renderRoute('/panel', { preview: true });

    await user.click(
      screen.getByRole('button', { name: 'Salir de la vista previa' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Acceso local' }),
    ).toBeInTheDocument();
    expect(store.getSnapshot()).toBeNull();
    expect(router.state.location.pathname).toBe('/acceso');
  });

  it('muestra una página 404 comprensible', async () => {
    const { router } = renderRoute('/ruta-inexistente', { preview: true });

    expect(
      await screen.findByRole('heading', { name: 'Esta página no existe' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/ruta-inexistente');
  });
});
