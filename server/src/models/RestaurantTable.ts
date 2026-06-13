// Restaurant Table — belongs to a floor

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRestaurantTable extends Document {
  tableNumber: number;
  seats: number;
  isActive: boolean;
  floorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IRestaurantTable>(
  {
    tableNumber: { type: Number, required: true },
    seats: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
  },
  { timestamps: true },
);

schema.index({ floorId: 1, tableNumber: 1 }, { unique: true });

export const RestaurantTable = mongoose.model<IRestaurantTable>('RestaurantTable', schema);