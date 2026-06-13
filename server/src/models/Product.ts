// Product — menu item linked to a category

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  categoryId: Types.ObjectId;
  price: number;
  unitOfMeasure: string;
  tax: number;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
    price: { type: Number, required: true },
    unitOfMeasure: { type: String, required: true },
    tax: { type: Number, default: 0 },
    description: { type: String },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Product = mongoose.model<IProduct>('Product', schema);