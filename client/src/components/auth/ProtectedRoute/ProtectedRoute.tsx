import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import { FullPageLoader } from '../FullPageLoader';

/**
 * Wraps every page that needs a logged-in user.
 * Not logged in → redirect to /login, remembering where they wanted to go
 * (so after logging in they land back on that page, not just the home page).
 *
 * This is about user experience — the real protection is on the server, which
 * rejects every habit request without a valid login cookie.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
