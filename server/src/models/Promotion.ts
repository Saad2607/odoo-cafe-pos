// Promotion — auto discount (product qty or order amount trigger)

import mongoose, { Schema, Document, Types } from 'mongoose';

export type PromotionTrigger = 'PRODUCT' | 'ORDER';
export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface IPromotion extends Document {
  name: string;
  triggerType: PromotionTrigger;
  minQuantity?: number;
  minOrderAmount?: number;
  discountType: DiscountType;
  discountValue: number;
  productId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IPromotion>(
  {
    name: { type: String, required: true, unique: true },
    triggerType: { type: String, enum: ['PRODUCT', 'ORDER'], required: true },
    minQuantity: { type: Number },
    minOrderAmount: { type: Number },
    discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
    discountValue: { type: Number, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Promotion = mongoose.model<IPromotion>('Promotion', schema);