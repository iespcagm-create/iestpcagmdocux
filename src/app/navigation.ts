import type { IconName } from '../shared/ui/Icon';

export interface NavigationItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: IconName;
}

export const navigationItems: NavigationItem[] = [
  { to: '/panel', label: 'Panel', shortLabel: 'Panel', icon: 'home' },
  {
    to: '/escanear',
    label: 'Escanear',
    shortLabel: 'Escanear',
    icon: 'scan',
  },
  {
    to: '/documentos',
    label: 'Mis documentos',
    shortLabel: 'Documentos',
    icon: 'documents',
  },
  {
    to: '/respaldos',
    label: 'Copias de seguridad',
    shortLabel: 'Copias',
    icon: 'backup',
  },
  {
    to: '/configuracion',
    label: 'Configuración',
    shortLabel: 'Ajustes',
    icon: 'settings',
  },
];

export function getPageLabel(pathname: string): string {
  return (
    navigationItems.find((item) => item.to === pathname)?.label ??
    'Página no encontrada'
  );
}
