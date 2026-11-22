import { Navigate, Outlet, useLocation, type Location } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import { FullPageLoader } from '../FullPageLoader';

/**
 * Wraps the login and register pages. A logged-in user is sent into the app instead —
 * to the page they originally asked for (set by ProtectedRoute), or to Today.
 * This is also what moves the user on right after a successful login/register.
 */
export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (isAuthenticated) {
    const from = (location.state as { from?: Location } | null)?.from;
    return <Navigate to={from ? `${from.pathname}${from.search}` : '/'} replace />;
  }
  return <Outlet />;
}
