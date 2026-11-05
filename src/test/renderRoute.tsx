import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryRouter,
  RouterProvider,
} from 'react-router-dom';
import { InMemorySessionStore } from '../modules/auth/infrastructure/InMemorySessionStore';
import { SessionProvider } from '../modules/auth/ui/SessionProvider';
import { appRoutes } from '../app/routes';

interface RenderRouteOptions {
  preview?: boolean;
}

export function renderRoute(
  initialPath: string,
  { preview = false }: RenderRouteOptions = {},
) {
  const store = new InMemorySessionStore();

  if (preview) {
    store.startPreview();
  }

  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialPath],
  });

  const view = render(
    <SessionProvider store={store}>
      <RouterProvider router={router} />
    </SessionProvider>,
  );

  return {
    ...view,
    router,
    store,
    user: userEvent.setup(),
  };
}
