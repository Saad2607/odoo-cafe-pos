// API client — talks to Express backend

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  isActive: boolean;
}

export interface PosSession {
  id: string;
  sessionNumber: string;
  openedAt: string;
  status: 'OPEN' | 'CLOSED';
  lastClosingSale: number | null;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  unitOfMeasure: string;
  tax: number;
  description: string;
  imageUrl?: string | null;
  isActive?: boolean;
  category: Category | null;
}

export interface TableInfo {
  id: string;
  tableNumber: number;
  seats: number;
  status: 'FREE' | 'OCCUPIED';
  isActive?: boolean;
}

export interface AdminFloor {
  id: string;
  name: string;
  tables: Array<{
    id: string;
    tableNumber: number;
    seats: number;
    isActive: boolean;
  }>;
}

export interface Floor {
  id: string;
  name: string;
  tables: TableInfo[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  amount: number;
  subtotal: number;
  taxAmount: number;
  discount: number;
  couponCode?: string | null;
  promotionName?: string | null;
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | null;
  amountReceived?: number | null;
  changeDue?: number | null;
  cardReference?: string | null;
  status: 'DRAFT' | 'PAID' | 'CANCELLED';
  kitchenStatus: 'NONE' | 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
  table: { id: string; tableNumber: number } | null;
  customer: { id: string; name: string; email: string | null; phone: string | null } | null;
  items: OrderItem[];
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface PaymentSettings {
  cashEnabled: boolean;
  cardEnabled: boolean;
  upiEnabled: boolean;
  upiId: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
  session: PosSession;
}

const TOKEN_KEY = 'odoo_pos_token';
const USER_KEY = 'odoo_pos_user';
const SESSION_KEY = 'odoo_pos_session';

export function saveAuth(token: string, user: User, session: PosSession) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getStoredSession(): PosSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

/** PDF: Employee → floor popup on session start; Admin → dashboard */
export function getHomeRoute(role: User['role']): string {
  return role === 'EMPLOYEE' ? '/floor' : '/dashboard';
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export async function signup(name: string, email: string, password: string) {
  return apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function login(email: string, password: string) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchFloors() {
  return apiFetch<{ floors: Floor[] }>('/floors');
}

export async function fetchAdminFloors() {
  return apiFetch<{ floors: AdminFloor[] }>('/floors/manage');
}

export async function createFloor(name: string) {
  return apiFetch<{ floor: AdminFloor }>('/floors', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateFloor(floorId: string, name: string) {
  return apiFetch<{ floor: { id: string; name: string } }>(`/floors/${floorId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export async function deleteFloor(floorId: string) {
  return apiFetch<{ message: string }>(`/floors/${floorId}`, { method: 'DELETE' });
}

export async function addTable(
  floorId: string,
  data: { tableNumber: number; seats: number; isActive?: boolean },
) {
  return apiFetch<{ table: AdminFloor['tables'][0] }>(`/floors/${floorId}/tables`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTable(
  tableId: string,
  data: Partial<{ tableNumber: number; seats: number; isActive: boolean }>,
) {
  return apiFetch<{ table: AdminFloor['tables'][0] }>(`/floors/tables/${tableId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTable(tableId: string) {
  return apiFetch<{ message: string }>(`/floors/tables/${tableId}`, { method: 'DELETE' });
}

export async function fetchProducts() {
  return apiFetch<{ products: Product[] }>('/products');
}

export async function fetchTableOrder(tableId: string) {
  return apiFetch<{ order: Order | null }>(`/orders/table/${tableId}`);
}

export async function createOrder(
  tableId: string,
  items: { productId: string; quantity: number }[],
  customerId?: string,
) {
  return apiFetch<{ message: string; order: Order }>('/orders', {
    method: 'POST',
    body: JSON.stringify({ tableId, items, customerId }),
  });
}

export async function payOrder(
  orderId: string,
  data: {
    paymentMethod: 'CASH' | 'CARD' | 'UPI';
    couponCode?: string;
    amountReceived?: number;
    cardReference?: string;
  },
) {
  return apiFetch<{
    message: string;
    order: Order;
    receipt?: { emailed: boolean; to?: string };
  }>(`/orders/${orderId}/pay`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function validateCoupon(code: string, subtotal: number, taxAmount: number) {
  return apiFetch<{
    code: string;
    discountType: string;
    discountValue: number;
    discount: number;
    total: number;
  }>('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal, taxAmount }),
  });
}

export async function fetchSessionStats() {
  return apiFetch<{
    session: {
      id: string;
      sessionNumber: string;
      openedAt: string;
      status: string;
      orderCount: number;
      paidOrderCount: number;
      totalSales: number;
      lastClosingSale: number | null;
    };
  }>('/session/current');
}

export async function closeSession() {
  return apiFetch<{
    message: string;
    summary: {
      sessionNumber: string;
      orderCount: number;
      totalSales: number;
      closedAt: string;
    };
  }>('/session/close', { method: 'POST' });
}

export async function fetchAllProducts() {
  return apiFetch<{ products: Product[] }>('/products/all');
}

export async function createProduct(data: {
  name: string;
  categoryId: string;
  price: number;
  unitOfMeasure: string;
  tax: number;
  description?: string;
}) {
  return apiFetch<{ product: Product }>('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(id: string, data: Partial<{
  name: string;
  categoryId: string;
  price: number;
  unitOfMeasure: string;
  tax: number;
  description: string;
}>) {
  return apiFetch<{ product: Product }>(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: string) {
  return apiFetch<{ message: string }>(`/products/${id}`, { method: 'DELETE' });
}

export async function fetchCategories() {
  return apiFetch<{ categories: Category[] }>('/products/categories');
}

export async function fetchKitchenQueue() {
  return apiFetch<{ orders: Order[] }>('/kitchen');
}

export async function updateKitchenStatus(orderId: string, kitchenStatus: Order['kitchenStatus']) {
  return apiFetch<{ message: string; order: Order }>(`/kitchen/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ kitchenStatus }),
  });
}

export async function fetchSessionOrders(q?: string) {
  const query = q ? `?q=${encodeURIComponent(q)}` : '';
  return apiFetch<{ orders: Order[] }>(`/orders/session${query}`);
}

export async function fetchOrder(orderId: string) {
  return apiFetch<{ order: Order }>(`/orders/${orderId}`);
}

export async function cancelOrder(orderId: string) {
  return apiFetch<{ message: string }>(`/orders/${orderId}`, { method: 'DELETE' });
}

export async function assignOrderCustomer(orderId: string, customerId: string | null) {
  return apiFetch<{ order: Order }>(`/orders/${orderId}/customer`, {
    method: 'PATCH',
    body: JSON.stringify({ customerId }),
  });
}

export async function fetchCustomers(q?: string) {
  const query = q ? `?q=${encodeURIComponent(q)}` : '';
  return apiFetch<{ customers: Customer[] }>(`/customers${query}`);
}

export async function createCustomer(data: { name: string; email?: string; phone?: string }) {
  return apiFetch<{ customer: Customer }>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(id: string, data: Partial<{ name: string; email: string; phone: string }>) {
  return apiFetch<{ customer: Customer }>(`/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function fetchPaymentSettings() {
  return apiFetch<{ settings: PaymentSettings }>('/payment-settings');
}

export async function updatePaymentSettings(data: Partial<PaymentSettings>) {
  return apiFetch<{ settings: PaymentSettings }>('/payment-settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function createCategory(data: { name: string; color: string }) {
  return apiFetch<{ category: Category }>('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCategory(id: string, data: Partial<{ name: string; color: string }>) {
  return apiFetch<{ category: Category }>(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string) {
  return apiFetch<{ message: string }>(`/categories/${id}`, { method: 'DELETE' });
}

export async function fetchAllCategories() {
  return apiFetch<{ categories: Category[] }>('/categories');
}
