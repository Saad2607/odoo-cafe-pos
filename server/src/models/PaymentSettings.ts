// Payment method toggles — Cash, Card, UPI (PDF §2.4)

import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentSettings extends Document {
  cashEnabled: boolean;
  cardEnabled: boolean;
  upiEnabled: boolean;
  upiId: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IPaymentSettings>(
  {
    cashEnabled: { type: Boolean, default: true },
    cardEnabled: { type: Boolean, default: true },
    upiEnabled: { type: Boolean, default: true },
    upiId: { type: String, default: 'cafe@upi' },
  },
  { timestamps: true },
);

export const PaymentSettings = mongoose.model<IPaymentSettings>('PaymentSettings', schema);

export async function getPaymentSettings() {
  let settings = await PaymentSettings.findOne();
  if (!settings) {
    settings = await PaymentSettings.create({});
  }
  return settings;
}
