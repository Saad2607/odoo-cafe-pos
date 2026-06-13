import { Schema, model, Document, Types } from 'mongoose';

export interface IComboItem {
  productId: Types.ObjectId;
  quantity: number;
}

export interface IComboMeal extends Document {
  name: string;
  description: string;
  price: number;
  discountPercent: number;
  items: IComboItem[];
  tagline: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const comboItemSchema = new Schema<IComboItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1 },
});

const comboSchema = new Schema<IComboMeal>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPercent: { type: Number, default: 10 },
    items: [comboItemSchema],
    tagline: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const ComboMeal = model<IComboMeal>('ComboMeal', comboSchema);
