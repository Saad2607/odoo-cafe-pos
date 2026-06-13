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
  sendToKitchen: boolean;
  isActive: boolean;
  tags: string[];
  isBestseller: boolean;
  isNewArrival: boolean;
  spiceLevel: number;
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
    sendToKitchen: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    isBestseller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    spiceLevel: { type: Number, default: 0, min: 0, max: 3 },
  },
  { timestamps: true },
);

export const Product = mongoose.model<IProduct>('Product', schema);