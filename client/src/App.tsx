import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import FloorPlanPage from './pages/FloorPlanPage';
import OrderPage from './pages/OrderPage';
import KitchenPage from './pages/KitchenPage';
import AdminProductsPage from './pages/AdminProductsPage';
import OrdersPage from './pages/OrdersPage';
import CustomersPage from './pages/CustomersPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminFloorPlanPage from './pages/AdminFloorPlanPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminDiscountsPage from './pages/AdminDiscountsPage';
import ReportsPage from './pages/ReportsPage';
import OrderDetailPage from './pages/OrderDetailPage';
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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/terminal" element={<Navigate to="/dashboard" replace />} />
          <Route path="/floor" element={<FloorPlanPage />} />
          <Route path="/order/:tableId" element={<OrderPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/kitchen" element={<KitchenPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/floors" element={<AdminFloorPlanPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/discounts" element={<AdminDiscountsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
