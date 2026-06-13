// Coupon — manual discount code entered at checkout

import mongoose, { Schema, Document } from 'mongoose';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface ICoupon extends Document {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true },
    discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
    discountValue: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Coupon = mongoose.model<ICoupon>('Coupon', schema);