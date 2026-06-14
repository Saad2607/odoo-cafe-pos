import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DialogProvider } from './context/DialogContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import FloorPlanPage from './pages/FloorPlanPage';
import OrderPage from './pages/OrderPage';
import KitchenPage from './pages/KitchenPage';
import AdminProductsPage from './pages/AdminProductsPage';
import MenuExplorerPage from './pages/MenuExplorerPage';
import OrdersPage from './pages/OrdersPage';
import CustomersPage from './pages/CustomersPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminFloorPlanPage from './pages/AdminFloorPlanPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminDiscountsPage from './pages/AdminDiscountsPage';
import ReportsPage from './pages/ReportsPage';
import BookingsPage from './pages/BookingsPage';
import LiveOpsPage from './pages/LiveOpsPage';
import KdsPage from './pages/KdsPage';
import PublicReceiptPage from './pages/PublicReceiptPage';
import OrderDetailPage from './pages/OrderDetailPage';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <DialogProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route path="/receipt/:token" element={<PublicReceiptPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/terminal" element={<Navigate to="/dashboard" replace />} />
          <Route path="/floor" element={<FloorPlanPage />} />
          <Route path="/order/:tableId" element={<OrderPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/kitchen" element={<KitchenPage />} />
          <Route path="/kds" element={<KdsPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/live-ops" element={<LiveOpsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/menu-explorer" element={<MenuExplorerPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/floors" element={<AdminFloorPlanPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/discounts" element={<AdminDiscountsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </BrowserRouter>
    </DialogProvider>
  );
}
