import { Navigate, Outlet } from 'react-router-dom';
import { getToken } from '../lib/api';

export function ProtectedRoute() {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function PublicRoute() {
  if (getToken()) return <Navigate to="/terminal" replace />;
  return <Outlet />;
}