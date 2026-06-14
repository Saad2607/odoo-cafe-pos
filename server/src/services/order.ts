import { Order } from '../models/Order.js';

import { Product } from '../models/Product.js';

import { applyPromotions } from './promotion.js';



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

  tipAmount?: number;

  couponCode?: string;

  promotionName?: string;

  paymentMethod?: string;

  amountReceived?: number;

  changeDue?: number;

  cardReference?: string;

  status: string;

  kitchenStatus: string;

  customerId?: { _id?: unknown; name?: string; email?: string; phone?: string } | unknown;

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



  const customer = order.customerId && typeof order.customerId === 'object'

    ? {

        id: String((order.customerId as { _id: unknown })._id),

        name: (order.customerId as { name: string }).name,

        email: (order.customerId as { email?: string }).email ?? null,

        phone: (order.customerId as { phone?: string }).phone ?? null,

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

    tipAmount: order.tipAmount ?? 0,

    couponCode: order.couponCode ?? null,

    promotionName: order.promotionName ?? null,

    paymentMethod: order.paymentMethod ?? null,

    amountReceived: order.amountReceived ?? null,

    changeDue: order.changeDue ?? null,

    cardReference: order.cardReference ?? null,

    status: order.status,

    kitchenStatus: order.kitchenStatus,

    table,

    customer,

    items: order.items.map((item) => ({
      id: String((item as { _id?: unknown })._id ?? item.productId),
      productId: String(item.productId),
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      discount: item.discount,
      kitchenDone: (item as { kitchenDone?: boolean }).kitchenDone ?? false,
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

  customerId?: string;

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



  const { discount, promotionName } = await applyPromotions(subtotal, taxAmount, lineItems);

  const amount = subtotal + taxAmount - discount;



  return Order.create({

    orderNumber: generateOrderNumber(),

    tableId: input.tableId,

    sessionId: input.sessionId,

    employeeId: input.employeeId,

    customerId: input.customerId,

    items: lineItems,

    subtotal,

    taxAmount,

    discount,

    promotionName,

    amount,

    status: 'DRAFT',

    kitchenStatus: 'PENDING',

  });

}

export async function updateDraftOrder(orderId: string, items: CreateOrderItemInput[]) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');
  if (order.status !== 'DRAFT') throw new Error('Only draft orders can be edited');

  const lineItems = [];
  let subtotal = 0;
  let taxAmount = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) throw new Error(`Product not found: ${item.productId}`);

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
      kitchenDone: false,
    });
  }

  const { discount, promotionName } = await applyPromotions(subtotal, taxAmount, lineItems);
  order.items = lineItems;
  order.subtotal = subtotal;
  order.taxAmount = taxAmount;
  order.discount = discount;
  order.promotionName = promotionName;
  order.amount = subtotal + taxAmount - discount;
  await order.save();
  return order;
}


