import { Navigate } from 'react-router-dom';
import { AccessPage } from '../../modules/auth/ui/AccessPage';
import { useSession } from '../../modules/auth/ui/sessionContext';

export function AccessRoute() {
  const { session } = useSession();

  if (session !== null) {
    return <Navigate replace to="/panel" />;
  }

  return <AccessPage />;
}
