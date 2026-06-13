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
  isActive?: boolean;
  category: Category | null;
}

export interface TableInfo {
  id: string;
  tableNumber: number;
  seats: number;
  status: 'FREE' | 'OCCUPIED';
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
  status: 'DRAFT' | 'PAID' | 'CANCELLED';
  kitchenStatus: 'NONE' | 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
  table: { id: string; tableNumber: number } | null;
  items: OrderItem[];
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

export async function fetchProducts() {
  return apiFetch<{ products: Product[] }>('/products');
}

export async function fetchTableOrder(tableId: string) {
  return apiFetch<{ order: Order | null }>(`/orders/table/${tableId}`);
}

export async function createOrder(tableId: string, items: { productId: string; quantity: number }[]) {
  return apiFetch<{ message: string; order: Order }>('/orders', {
    method: 'POST',
    body: JSON.stringify({ tableId, items }),
  });
}

export async function payOrder(orderId: string, couponCode?: string) {
  return apiFetch<{ message: string; order: Order }>(`/orders/${orderId}/pay`, {
    method: 'PATCH',
    body: JSON.stringify(couponCode ? { couponCode } : {}),
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
