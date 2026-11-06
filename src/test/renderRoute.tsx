import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryRouter,
  RouterProvider,
} from 'react-router-dom';
import { InMemorySessionStore } from '../modules/auth/infrastructure/InMemorySessionStore';
import { AppProviders } from '../app/providers';
import { appRoutes } from '../app/routes';

interface RenderRouteOptions {
  authenticated?: boolean;
}

export function renderRoute(
  initialPath: string,
  { authenticated = false }: RenderRouteOptions = {},
) {
  const store = new InMemorySessionStore();

  if (authenticated) {
    store.startSession();
  }

  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialPath],
  });

  const view = render(
    <AppProviders sessionStore={store}>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  return {
    ...view,
    router,
    store,
    user: userEvent.setup(),
  };
}
