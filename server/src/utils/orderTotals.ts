export function orderTipAmount(order: { tipAmount?: number | null }) {
  return order.tipAmount ?? 0;
}

export function orderGrandTotal(order: { amount: number; tipAmount?: number | null }) {
  return order.amount + orderTipAmount(order);
}
