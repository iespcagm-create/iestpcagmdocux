import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { BackupPage } from '../modules/backup/ui/BackupPage';
import { DocumentsPage } from '../modules/documents/ui/DocumentsPage';
import { ScannerPage } from '../modules/scanner/ui/ScannerPage';
import { SettingsPage } from '../modules/settings/ui/SettingsPage';
import { AccessRoute } from './guards/AccessRoute';
import { ProtectedLayout } from './guards/ProtectedLayout';
import { NotFoundPage } from './pages/NotFoundPage';
import { PanelPage } from './pages/PanelPage';

export const appRoutes: RouteObject[] = [
  {
    path: '/acceso',
    element: <AccessRoute />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Navigate replace to="/panel" />,
      },
      {
        path: 'panel',
        element: <PanelPage />,
      },
      {
        path: 'escanear',
        element: <ScannerPage />,
      },
      {
        path: 'documentos',
        element: <DocumentsPage />,
      },
      {
        path: 'respaldos',
        element: <BackupPage />,
      },
      {
        path: 'configuracion',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];
