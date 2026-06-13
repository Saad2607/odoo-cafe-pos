// Floor — restaurant floor for table layout

import mongoose, { Schema, Document } from 'mongoose';

export interface IFloor extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IFloor>(
  { name: { type: String, required: true, unique: true } },
  { timestamps: true },
);

export const Floor = mongoose.model<IFloor>('Floor', schema);