/** The number printed on a receipt, made from the payment's id. */
export const receiptNumber = (paymentId: string) =>
  `PM-${paymentId.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
