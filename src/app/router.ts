import { createHashRouter } from 'react-router-dom';
import { appRoutes } from './routes';

export function createAppRouter() {
  return createHashRouter(appRoutes);
}
