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
  sendToKitchen?: boolean;
  isActive?: boolean;
  tags?: string[];
  isBestseller?: boolean;
  isNewArrival?: boolean;
  spiceLevel?: number;
  category: Category | null;
}

export interface ProductStats {
  totalProducts: number;
  totalCategories: number;
  bestsellers: number;
  newItems: number;
  vegItems: number;
  categories: Array<Category & { count: number }>;
}

export interface ComboMeal {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  discountPercent: number;
  originalTotal: number;
  savings: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    category: Category | null;
  }>;
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
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discount: number;
  kitchenDone?: boolean;
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

export interface Booking {
  id: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  bookingDate: string;
  bookingTime: string;
  partySize: number;
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED';
  notes: string | null;
  table: { id: string; tableNumber: number } | null;
}

const TABLE_KEY = 'pos_current_table';

export function setCurrentTable(tableNumber: number | null) {
  if (tableNumber == null) sessionStorage.removeItem(TABLE_KEY);
  else sessionStorage.setItem(TABLE_KEY, String(tableNumber));
}

export function getCurrentTable(): number | null {
  const v = sessionStorage.getItem(TABLE_KEY);
  return v ? Number(v) : null;
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

/** Admin → dashboard; Employee → floor with table popup */
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

export async function fetchProducts(params?: {
  categoryId?: string;
  tag?: string;
  bestseller?: boolean;
  new?: boolean;
  q?: string;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.categoryId) qs.set('categoryId', params.categoryId);
  if (params?.tag) qs.set('tag', params.tag);
  if (params?.bestseller) qs.set('bestseller', 'true');
  if (params?.new) qs.set('new', 'true');
  if (params?.q) qs.set('q', params.q);
  if (params?.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return apiFetch<{ products: Product[] }>(`/products${query ? `?${query}` : ''}`);
}

export async function fetchProductStats() {
  return apiFetch<ProductStats>('/products/stats');
}

export async function fetchCombos() {
  return apiFetch<{ combos: ComboMeal[] }>('/combos');
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
    receipt?: { emailed: boolean; to?: string; viewUrl?: string; emailSent?: boolean };
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

export async function fetchAllProducts(params?: { page?: number; limit?: number; categoryId?: string; q?: string }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.categoryId) qs.set('categoryId', params.categoryId);
  if (params?.q) qs.set('q', params.q);
  const query = qs.toString();
  return apiFetch<{ products: Product[]; total: number; page: number; limit: number }>(
    `/products/all${query ? `?${query}` : ''}`,
  );
}

export async function createProduct(data: {
  name: string;
  categoryId: string;
  price: number;
  unitOfMeasure: string;
  tax: number;
  description?: string;
  sendToKitchen?: boolean;
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

export async function fetchAllCategories() {
  return apiFetch<{ categories: Category[] }>('/categories');
}

export async function fetchUsers() {
  return apiFetch<{ users: User[] }>('/users');
}

export async function createUser(data: { name: string; email: string; password: string; role: User['role'] }) {
  return apiFetch<{ user: User }>('/users', { method: 'POST', body: JSON.stringify(data) });
}

export async function changeUserPassword(id: string, password: string) {
  return apiFetch<{ user: User }>(`/users/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}

export async function archiveUser(id: string) {
  return apiFetch<{ user: User }>(`/users/${id}/archive`, { method: 'PATCH' });
}

export async function restoreUser(id: string) {
  return apiFetch<{ user: User }>(`/users/${id}/restore`, { method: 'PATCH' });
}

export async function deleteUser(id: string) {
  return apiFetch<{ message: string }>(`/users/${id}`, { method: 'DELETE' });
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  isActive: boolean;
}

export interface Promotion {
  id: string;
  name: string;
  triggerType: 'PRODUCT' | 'ORDER';
  minQuantity: number | null;
  minOrderAmount: number | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  productId: string | null;
  productName: string | null;
  isActive: boolean;
}

export async function fetchAdminCoupons() {
  return apiFetch<{ coupons: Coupon[] }>('/discounts/coupons');
}

export async function createCoupon(data: Omit<Coupon, 'id'>) {
  return apiFetch<{ coupon: Coupon }>('/discounts/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCoupon(id: string, data: Partial<Omit<Coupon, 'id'>>) {
  return apiFetch<{ coupon: Coupon }>(`/discounts/coupons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCoupon(id: string) {
  return apiFetch<{ message: string }>(`/discounts/coupons/${id}`, { method: 'DELETE' });
}

export async function fetchAdminPromotions() {
  return apiFetch<{ promotions: Promotion[] }>('/discounts/promotions');
}

export async function createPromotion(data: Record<string, unknown>) {
  return apiFetch<{ promotion: Promotion }>('/discounts/promotions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deletePromotion(id: string) {
  return apiFetch<{ message: string }>(`/discounts/promotions/${id}`, { method: 'DELETE' });
}

export interface ReportData {
  metrics: { totalOrders: number; revenue: number; avgOrderValue: number };
  salesTrend: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<{ name: string; qty: number; revenue: number }>;
  topCategories: Array<{ name: string; revenue: number }>;
  topOrders: Array<{ orderNumber: string; date: string; amount: number }>;
  filters: {
    employees: Array<{ id: string; name: string }>;
    sessions: Array<{ id: string; sessionNumber: string; openedAt: string }>;
    products: Array<{ id: string; name: string }>;
  };
}

export async function fetchReports(params?: {
  period?: string;
  employeeId?: string;
  sessionId?: string;
  productId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const q = new URLSearchParams();
  if (params?.period) q.set('period', params.period);
  if (params?.employeeId) q.set('employeeId', params.employeeId);
  if (params?.sessionId) q.set('sessionId', params.sessionId);
  if (params?.productId) q.set('productId', params.productId);
  if (params?.fromDate) q.set('fromDate', params.fromDate);
  if (params?.toDate) q.set('toDate', params.toDate);
  const query = q.toString() ? `?${q}` : '';
  return apiFetch<ReportData>(`/reports${query}`);
}

export async function updateDraftOrder(orderId: string, items: { productId: string; quantity: number }[]) {
  return apiFetch<{ order: Order }>(`/orders/${orderId}/items`, {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  });
}

export async function toggleKitchenItem(orderId: string, itemId: string) {
  return apiFetch<{ order: Order }>(`/kitchen/${orderId}/items/${itemId}/done`, { method: 'PATCH' });
}

export async function fetchKitchenQueue(params?: { q?: string; categoryId?: string; productId?: string }) {
  const q = new URLSearchParams();
  if (params?.q) q.set('q', params.q);
  if (params?.categoryId) q.set('categoryId', params.categoryId);
  if (params?.productId) q.set('productId', params.productId);
  const query = q.toString() ? `?${q}` : '';
  return apiFetch<{ orders: Order[] }>(`/kitchen${query}`);
}

export async function updateKitchenStatus(orderId: string, kitchenStatus: Order['kitchenStatus']) {
  return apiFetch<{ message: string; order: Order }>(`/kitchen/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ kitchenStatus }),
  });
}

export async function fetchSessionOrders(params?: { q?: string; date?: string }) {
  const q = new URLSearchParams();
  if (params?.q) q.set('q', params.q);
  if (params?.date) q.set('date', params.date);
  const query = q.toString() ? `?${q}` : '';
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

export async function deleteCustomer(id: string) {
  return apiFetch<{ message: string }>(`/customers/${id}`, { method: 'DELETE' });
}

export async function sendReceiptEmail(orderId: string, email: string) {
  return apiFetch<{
    message: string;
    sent: boolean;
    emailSent: boolean;
    viewUrl: string;
    recipient?: string;
    emailError?: string | null;
  }>(`/orders/${orderId}/send-receipt`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function fetchPublicReceipt(token: string) {
  const res = await fetch(`/api/receipt/${token}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Receipt not found' }));
    throw new Error(err.error || 'Receipt not found');
  }
  return res.json() as Promise<{ order: Order }>;
}

export async function openSession() {
  return apiFetch<{ session: { id: string; sessionNumber: string } }>('/session/open', {
    method: 'POST',
  });
}

export async function fetchBookings(params?: { date?: string; status?: string }) {
  const q = new URLSearchParams();
  if (params?.date) q.set('date', params.date);
  if (params?.status) q.set('status', params.status);
  const query = q.toString() ? `?${q}` : '';
  return apiFetch<{ bookings: Booking[] }>(`/bookings${query}`);
}

export async function createBooking(data: {
  customerName: string;
  email?: string;
  phone?: string;
  bookingDate: string;
  bookingTime: string;
  partySize: number;
  tableId?: string;
  notes?: string;
}) {
  return apiFetch<{ booking: Booking }>('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBooking(id: string, data: Partial<{
  customerName: string;
  email: string;
  phone: string;
  bookingDate: string;
  bookingTime: string;
  partySize: number;
  tableId: string;
  status: Booking['status'];
  notes: string;
}>) {
  return apiFetch<{ booking: Booking }>(`/bookings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteBooking(id: string) {
  return apiFetch<{ message: string }>(`/bookings/${id}`, { method: 'DELETE' });
}

export interface LiveOpsData {
  session: {
    sessionNumber: string;
    openedAt?: string;
    lastClosingSale: number;
  };
  stats: {
    totalSales: number;
    paidCount: number;
    kitchenCount: number;
    activeTables: number;
    totalTables: number;
    draftCount: number;
  };
  floors: Array<{
    id: string;
    name: string;
    tables: Array<{
      id: string;
      tableNumber: number;
      seats: number;
      status: 'FREE' | 'OCCUPIED';
    }>;
  }>;
  kitchenQueue: Array<{
    id: string;
    orderNumber: string;
    kitchenStatus: string;
    tableNumber: number | null;
    itemCount: number;
    amount: number;
  }>;
  recentSales: Array<{
    orderNumber: string;
    amount: number;
    date: string;
    paymentMethod: string | null;
  }>;
}

export async function fetchLiveOps() {
  return apiFetch<LiveOpsData>('/live');
}
