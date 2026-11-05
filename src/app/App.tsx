import { RouterProvider } from 'react-router-dom';
import { AppErrorBoundary } from './errors/AppErrorBoundary';
import { AppProviders } from './providers';
import { createAppRouter } from './router';

const router = createAppRouter();

export function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  );
}
