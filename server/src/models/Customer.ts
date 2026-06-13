// Customer — cafe visitor

import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
  },
  { timestamps: true },
);

export const Customer = mongoose.model<ICustomer>('Customer', schema);