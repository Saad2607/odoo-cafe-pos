// Product Category — name + color for POS UI

import mongoose, { Schema, Document } from 'mongoose';

export interface IProductCategory extends Document {
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IProductCategory>(
  {
    name: { type: String, required: true, unique: true },
    color: { type: String, required: true },
  },
  { timestamps: true },
);

export const ProductCategory = mongoose.model<IProductCategory>('ProductCategory', schema);