// POS Session — cashier shift, opens on login

import mongoose, { Schema, Document, Types } from 'mongoose';

export type SessionStatus = 'OPEN' | 'CLOSED';

export interface IPosSession extends Document {
  sessionNumber: string;
  openedAt: Date;
  closedAt?: Date;
  status: SessionStatus;
  openingBalance: number;
  closingBalance?: number;
  lastClosingSale?: number;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IPosSession>(
  {
    sessionNumber: { type: String, required: true, unique: true },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
    openingBalance: { type: Number, default: 0 },
    closingBalance: { type: Number },
    lastClosingSale: { type: Number },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const PosSession = mongoose.model<IPosSession>('PosSession', schema);