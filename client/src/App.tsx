import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TerminalPage from './pages/TerminalPage';
import FloorPlanPage from './pages/FloorPlanPage';
import OrderPage from './pages/OrderPage';
import KitchenPage from './pages/KitchenPage';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/terminal" element={<TerminalPage />} />
          <Route path="/floor" element={<FloorPlanPage />} />
          <Route path="/order/:tableId" element={<OrderPage />} />
          <Route path="/kitchen" element={<KitchenPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}