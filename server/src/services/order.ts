import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `ORD-${date}-${time}-${ms}-${rand}`;
}

export function formatOrder(order: {
  _id: unknown;
  orderNumber: string;
  date: Date;
  amount: number;
  subtotal: number;
  taxAmount: number;
  discount: number;
  couponCode?: string;
  status: string;
  kitchenStatus: string;
  tableId?: { _id?: unknown; tableNumber?: number } | unknown;
  items: Array<{
    productId: unknown;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    discount: number;
  }>;
}) {
  const table = order.tableId && typeof order.tableId === 'object'
    ? {
        id: String((order.tableId as { _id: unknown })._id),
        tableNumber: (order.tableId as { tableNumber: number }).tableNumber,
      }
    : null;

  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    date: order.date,
    amount: order.amount,
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    discount: order.discount,
    couponCode: order.couponCode ?? null,
    status: order.status,
    kitchenStatus: order.kitchenStatus,
    table,
    items: order.items.map((item) => ({
      productId: String(item.productId),
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      discount: item.discount,
    })),
  };
}

interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export async function createOrder(input: {
  tableId: string;
  sessionId: string;
  employeeId: string;
  items: CreateOrderItemInput[];
}) {
  if (!input.items.length) {
    throw new Error('Order must have at least one item');
  }

  const existing = await Order.findOne({ tableId: input.tableId, status: 'DRAFT' });
  if (existing) {
    throw new Error('This table already has an open order');
  }

  const lineItems = [];
  let subtotal = 0;
  let taxAmount = 0;

  for (const item of input.items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const lineTotal = product.price * item.quantity;
    const lineTax = lineTotal * (product.tax / 100);
    subtotal += lineTotal;
    taxAmount += lineTax;

    lineItems.push({
      productId: product._id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal,
      discount: 0,
    });
  }

  const amount = subtotal + taxAmount;

  return Order.create({
    orderNumber: generateOrderNumber(),
    tableId: input.tableId,
    sessionId: input.sessionId,
    employeeId: input.employeeId,
    items: lineItems,
    subtotal,
    taxAmount,
    discount: 0,
    amount,
    status: 'DRAFT',
    kitchenStatus: 'PENDING',
  });
}
