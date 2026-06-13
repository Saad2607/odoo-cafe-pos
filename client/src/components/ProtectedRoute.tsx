import { Navigate, Outlet } from 'react-router-dom';
import { getToken, getStoredUser, getHomeRoute } from '../lib/api';

export function ProtectedRoute() {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function PublicRoute() {
  if (getToken()) {
    const user = getStoredUser();
    return <Navigate to={getHomeRoute(user?.role ?? 'EMPLOYEE')} replace />;
  }
  return <Outlet />;
}