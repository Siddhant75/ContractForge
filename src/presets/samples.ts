export interface Preset {
  id: string;
  name: string;
  icon: string;
  description: string;
  data: string;
}

export const STRIPE_PAYMENT_SAMPLE = JSON.stringify({
  id: "pi_3MtwBwLkdIwHu7ix28a3tqPa",
  object: "payment_intent",
  amount: 2000,
  amount_received: 2000,
  currency: "usd",
  status: "succeeded",
  client_secret: "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_YrZ",
  created: "2026-10-17T12:00:00Z",
  customer_email: "alex.chen@example.com",
  payment_method_types: ["card"],
  metadata: {
    order_id: "order_98234",
    platform: "web"
  },
  charges: [
    {
      id: "ch_1MtwBxLkdIwHu7ix33bc89",
      amount: 2000,
      paid: true,
      receipt_url: "https://pay.stripe.com/receipts/acct_123/ch_123"
    }
  ]
}, null, 2);

export const PRESETS: Preset[] = [
  {
    id: 'stripe',
    name: 'Stripe Payment',
    icon: 'credit-card',
    description: 'Nested objects, currencies, status enums & arrays',
    data: STRIPE_PAYMENT_SAMPLE
  }
];
