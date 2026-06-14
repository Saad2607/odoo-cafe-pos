// Order — with embedded items array (MongoDB document style)

import mongoose, { Schema, Document, Types } from 'mongoose';

export type OrderStatus = 'DRAFT' | 'PAID' | 'CANCELLED';
export type KitchenStatus = 'NONE' | 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI';

export interface IOrderItem {
  productId: Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discount: number;
  kitchenDone?: boolean;
}

export interface IOrder extends Document {
  orderNumber: string;
  date: Date;
  customerId?: Types.ObjectId;
  amount: number;
  subtotal: number;
  taxAmount: number;
  discount: number;
  tipAmount: number;
  couponCode?: string;
  promotionName?: string;
  paymentMethod?: PaymentMethod;
  amountReceived?: number;
  changeDue?: number;
  cardReference?: string;
  status: OrderStatus;
  kitchenStatus: KitchenStatus;
  tableId?: Types.ObjectId;
  sessionId: Types.ObjectId;
  employeeId: Types.ObjectId;
  items: IOrderItem[];
  receiptToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    kitchenDone: { type: Boolean, default: false },
  },
  { _id: true },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    amount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tipAmount: { type: Number, default: 0 },
    couponCode: { type: String },
    promotionName: { type: String },
    paymentMethod: { type: String, enum: ['CASH', 'CARD', 'UPI'] },
    amountReceived: { type: Number },
    changeDue: { type: Number },
    cardReference: { type: String },
    status: { type: String, enum: ['DRAFT', 'PAID', 'CANCELLED'], default: 'DRAFT' },
    kitchenStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'PREPARING', 'READY', 'SERVED'],
      default: 'NONE',
    },
    tableId: { type: Schema.Types.ObjectId, ref: 'RestaurantTable' },
    sessionId: { type: Schema.Types.ObjectId, ref: 'PosSession', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    receiptToken: { type: String, index: true },
  },
  { timestamps: true },
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);