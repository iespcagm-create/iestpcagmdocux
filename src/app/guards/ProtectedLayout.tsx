import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../../modules/auth/ui/sessionContext';
import { AppLayout } from '../layout/AppLayout';

export function ProtectedLayout() {
  const { session } = useSession();
  const location = useLocation();

  if (session === null) {
    return (
      <Navigate
        replace
        state={{ from: location.pathname }}
        to="/acceso"
      />
    );
  }

  return <AppLayout />;
}
