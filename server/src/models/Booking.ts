import mongoose, { Schema, Document, Types } from 'mongoose';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED';

export interface IBooking extends Document {
  customerName: string;
  email?: string;
  phone?: string;
  bookingDate: Date;
  bookingTime: string;
  partySize: number;
  tableId?: Types.ObjectId;
  status: BookingStatus;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IBooking>(
  {
    customerName: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    bookingDate: { type: Date, required: true },
    bookingTime: { type: String, required: true },
    partySize: { type: Number, required: true, min: 1 },
    tableId: { type: Schema.Types.ObjectId, ref: 'RestaurantTable' },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED'],
      default: 'PENDING',
    },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const Booking = mongoose.model<IBooking>('Booking', schema);
