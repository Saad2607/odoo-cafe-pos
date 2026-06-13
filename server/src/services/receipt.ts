import crypto from 'crypto';
import nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer/index.js';
import { env } from '../config/env.js';
import { formatOrder } from './order.js';
import type { IOrder } from '../models/Order.js';

export function ensureReceiptToken(order: IOrder): string {
  if (order.receiptToken) return order.receiptToken;
  const token = crypto.randomBytes(24).toString('hex');
  order.receiptToken = token;
  return token;
}

function buildReceiptText(order: ReturnType<typeof formatOrder>): string {
  const lines = [
    'BRIVIO — Odoo Cafe POS',
    `Order: ${order.orderNumber}`,
    `Date: ${new Date(order.date).toLocaleString()}`,
    order.table ? `Table: ${order.table.tableNumber}` : '',
    order.customer ? `Customer: ${order.customer.name}` : '',
    '---',
    ...order.items.map((i) => {
      const promo = i.discount > 0 ? ` (promo −₹${i.discount})` : '';
      return `${i.productName} x${i.quantity} @ ₹${i.unitPrice} — ₹${i.lineTotal.toFixed(0)}${promo}`;
    }),
    '---',
    `Subtotal: ₹${order.subtotal.toFixed(0)}`,
    `Tax: ₹${order.taxAmount.toFixed(0)}`,
    order.discount > 0 ? `Discount: -₹${order.discount.toFixed(0)}` : '',
    order.couponCode ? `Coupon: ${order.couponCode}` : '',
    order.promotionName ? `Promotion: ${order.promotionName}` : '',
    `Total: ₹${order.amount.toFixed(0)}`,
    order.paymentMethod ? `Paid via: ${order.paymentMethod}` : '',
    '',
    'Thank you for visiting Brivio!',
  ].filter(Boolean);
  return lines.join('\n');
}

function buildReceiptHtml(order: ReturnType<typeof formatOrder>, viewUrl: string): string {
  const itemsHtml = order.items.map((i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${i.productName}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">₹${i.unitPrice}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">₹${i.lineTotal.toFixed(0)}</td>
    </tr>
    ${i.discount > 0 ? `<tr><td colspan="4" style="color:#2e7d32;font-size:12px;padding-bottom:8px;">Promo on this item: −₹${i.discount}</td></tr>` : ''}
  `).join('');

  return `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;background:#FDFBF7;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e8ddd4;border-radius:12px;padding:24px;">
    <h1 style="color:#9E4B3A;margin:0 0 4px;">BRIVIO</h1>
    <p style="color:#8a8494;margin:0 0 20px;">Your cafe receipt</p>
    <p><strong>Order:</strong> ${order.orderNumber}</p>
    <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
    ${order.table ? `<p><strong>Table:</strong> ${order.table.tableNumber}</p>` : ''}
    ${order.customer ? `<p><strong>Customer:</strong> ${order.customer.name}</p>` : ''}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead><tr style="color:#5C534A;font-size:12px;">
        <th style="text-align:left;padding-bottom:8px;">Item</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Unit</th>
        <th style="text-align:right;">Total</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p>Subtotal: ₹${order.subtotal.toFixed(0)}</p>
    <p>Tax: ₹${order.taxAmount.toFixed(0)}</p>
    ${order.discount > 0 ? `<p style="color:#2e7d32;">Discount: −₹${order.discount.toFixed(0)}</p>` : ''}
    <p style="font-size:20px;font-weight:bold;color:#9E4B3A;">Total: ₹${order.amount.toFixed(0)}</p>
    ${order.paymentMethod ? `<p>Paid via: ${order.paymentMethod}</p>` : ''}
    <p style="margin-top:24px;"><a href="${viewUrl}" style="background:#9E4B3A;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">View Receipt Online</a></p>
    <p style="color:#8a8494;font-size:12px;margin-top:20px;">Thank you for visiting Brivio Cafe!</p>
  </div>
</body></html>`;
}

function getMailer(): Transporter | null {
  if (!env.smtp.user || !env.smtp.pass) {
    return null;
  }

  // Gmail works best with the built-in service transport
  if (env.smtp.user.includes('@gmail.com') || env.smtp.host === 'smtp.gmail.com') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }

  return nodemailer.createTransport({
    host: env.smtp.host || 'smtp.gmail.com',
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
    tls: { rejectUnauthorized: true },
  });
}

export async function verifySmtpConnection(): Promise<{ ok: boolean; message: string }> {
  const transporter = getMailer();
  if (!transporter) {
    return { ok: false, message: 'SMTP_USER and SMTP_PASS not set in server .env' };
  }
  try {
    await transporter.verify();
    return { ok: true, message: `Gmail SMTP ready for ${env.smtp.user}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'SMTP verify failed';
    return { ok: false, message: msg };
  }
}

function recipientAccepted(info: nodemailer.SentMessageInfo, recipient: string): boolean {
  const accepted = (info.accepted ?? []).map((a: string) => String(a).toLowerCase());
  const rejected = (info.rejected ?? []).map((r: string) => String(r).toLowerCase());
  if (rejected.includes(recipient)) return false;
  return accepted.some((a: string) => a === recipient || a.includes(recipient));
}

export async function sendReceiptEmail(order: IOrder, to: string): Promise<{
  sent: boolean;
  emailSent: boolean;
  preview: string;
  viewUrl: string;
  recipient: string;
  emailError?: string;
  messageId?: string;
}> {
  const recipient = to.trim().toLowerCase();
  if (!recipient.includes('@')) {
    throw new Error('Invalid recipient email address');
  }

  if (order.status !== 'PAID') {
    throw new Error('Receipt can only be sent after the order is paid');
  }

  await order.populate('tableId', 'tableNumber');
  await order.populate('customerId', 'name email phone');
  const token = ensureReceiptToken(order);
  await order.save();

  const formatted = formatOrder(order);
  const viewUrl = `${env.clientUrl}/receipt/${token}`;
  const text = buildReceiptText(formatted);
  const html = buildReceiptHtml(formatted, viewUrl);

  const transporter = getMailer();
  let emailSent = false;
  let emailError: string | undefined;
  let messageId: string | undefined;

  if (transporter) {
    try {
      await transporter.verify();

      const info = await transporter.sendMail({
        from: env.smtp.user,
        replyTo: env.smtp.user,
        to: recipient,
        subject: `Brivio Receipt — ${order.orderNumber}`,
        text: `${text}\n\nView online: ${viewUrl}`,
        html,
      });

      messageId = info.messageId;

      if (recipientAccepted(info, recipient)) {
        emailSent = true;
        console.log(`[Receipt] Gmail accepted → ${recipient} (from ${env.smtp.user}) id=${info.messageId}`);
        console.log(`[Receipt] If not in inbox, check Spam/Promotions. View link: ${viewUrl}`);
      } else {
        emailError = `Gmail did not accept ${recipient}. Rejected: ${(info.rejected ?? []).join(', ') || 'unknown'}`;
        console.error(`[Receipt] ${emailError}`);
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : 'Email delivery failed';
      console.error(`[Receipt] SMTP failed TO ${recipient}:`, emailError);
    }
  } else {
    emailError = 'SMTP not configured — add SMTP_USER and SMTP_PASS (Google App Password) in server .env, then restart server';
    console.log(`[Receipt] ${emailError}`);
    console.log(`[Receipt] View link for ${recipient}: ${viewUrl}`);
  }

  return { sent: true, emailSent, preview: text, viewUrl, recipient, emailError, messageId };
}

export async function getReceiptByToken(token: string) {
  const { Order } = await import('../models/Order.js');
  const order = await Order.findOne({ receiptToken: token })
    .populate('tableId', 'tableNumber')
    .populate('customerId', 'name email phone');
  if (!order || order.status !== 'PAID') return null;
  return formatOrder(order);
}
