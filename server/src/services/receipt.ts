import { formatOrder } from './order.js';
import type { IOrder } from '../models/Order.js';

function buildReceiptText(order: ReturnType<typeof formatOrder>): string {
  const lines = [
    'BRIVIO — Odoo Cafe POS',
    `Order: ${order.orderNumber}`,
    `Date: ${new Date(order.date).toLocaleString()}`,
    order.table ? `Table: ${order.table.tableNumber}` : '',
    order.customer ? `Customer: ${order.customer.name}` : '',
    '---',
    ...order.items.map((i) => `${i.productName} x${i.quantity} — ₹${i.lineTotal.toFixed(0)}`),
    '---',
    `Subtotal: ₹${order.subtotal.toFixed(0)}`,
    `Tax: ₹${order.taxAmount.toFixed(0)}`,
    order.discount > 0 ? `Discount: -₹${order.discount.toFixed(0)}` : '',
    `Total: ₹${order.amount.toFixed(0)}`,
    order.paymentMethod ? `Paid via: ${order.paymentMethod}` : '',
    '',
    'Thank you for visiting Brivio!',
  ].filter(Boolean);
  return lines.join('\n');
}

export async function sendReceiptEmail(order: IOrder, to: string): Promise<{ sent: boolean; preview: string }> {
  await order.populate('tableId', 'tableNumber');
  await order.populate('customerId', 'name email phone');
  const formatted = formatOrder(order);
  const body = buildReceiptText(formatted);

  // Demo: log receipt; wire SMTP via env for production
  if (process.env.SMTP_HOST) {
    console.log(`[Receipt] SMTP configured — would send to ${to}`);
  } else {
    console.log(`[Receipt Email → ${to}]\n${body}`);
  }

  return { sent: true, preview: body };
}
