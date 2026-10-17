export interface Preset {
  id: string;
  name: string;
  badge: string;
  description: string;
  data: string;
}

export const STRIPE_PAYMENT_SAMPLE = JSON.stringify({
  id: "pi_3MtwBwLkdIwHu7ix28a3tqPa",
  object: "payment_intent",
  amount: 2000,
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

export const WEATHER_TOOL_SAMPLE = JSON.stringify({
  latitude: 37.7749,
  longitude: -122.4194,
  location_name: "San Francisco, CA",
  units: "celsius",
  include_forecast: true,
  alert_level: "advisory",
  requested_at: "2026-10-17T14:30:00Z"
}, null, 2);

export const GITHUB_ISSUE_SAMPLE = JSON.stringify({
  repository: "octocat/Hello-World",
  issue_id: 1347,
  title: "Found a bug in contract parsing engine",
  body: "When pasting cURL with single quotes, the parser should auto-recover.",
  state: "open",
  labels: ["bug", "triage", "v1.0"],
  milestone: {
    id: 42,
    title: "Sprint 14 Release",
    due_on: "2026-10-31T23:59:59Z"
  },
  assignee: {
    login: "octocat",
    avatar_url: "https://github.com/images/error/octocat_happy.gif",
    site_admin: false
  }
}, null, 2);

export const ECOMMERCE_ORDER_SAMPLE = JSON.stringify({
  order_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  order_number: "ORD-2026-9041",
  created_at: "2026-10-17T18:45:00Z",
  customer: {
    id: "cust_7890",
    name: "Dr. Evelyn Reed",
    email: "evelyn.reed@biotech-research.org",
    phone: "+1-555-0199"
  },
  shipping_address: {
    street: "742 Evergreen Terrace",
    city: "Springfield",
    postal_code: "97477",
    country: "US"
  },
  items: [
    {
      sku: "PROD-A101",
      title: "Noise Cancelling Developer Headphones",
      quantity: 1,
      unit_price: 299.99,
      tags: ["hardware", "audio"]
    },
    {
      sku: "PROD-B204",
      title: "Ergonomic Mechanical Keyboard",
      quantity: 2,
      unit_price: 149.50
    }
  ],
  total_tax: 47.92,
  grand_total: 646.91,
  is_gift: false
}, null, 2);

export const CURL_STRIPE_SAMPLE = `curl -X POST "https://api.stripe.com/v1/payment_intents" \\
  -H "Authorization: Bearer sk_test_51Mz93kd..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 4900,
    "currency": "usd",
    "description": "Enterprise API Subscription",
    "customer": "cus_N7Wq208",
    "receipt_email": "billing@acme-corp.com",
    "automatic_payment_methods": {
      "enabled": true
    }
  }'`;

export const PRESETS: Preset[] = [
  {
    id: 'stripe',
    name: 'Stripe Payment',
    badge: 'API Intent',
    description: 'Nested objects, currencies, status enums & charges',
    data: STRIPE_PAYMENT_SAMPLE
  },
  {
    id: 'curl-post',
    name: 'cURL Command',
    badge: 'Terminal Ingestion',
    description: 'Multi-line bash cURL with headers and JSON payload',
    data: CURL_STRIPE_SAMPLE
  },
  {
    id: 'weather',
    name: 'Weather Tool',
    badge: 'Agent Spec',
    description: 'Coordinates, enums & function-calling inputs',
    data: WEATHER_TOOL_SAMPLE
  },
  {
    id: 'github',
    name: 'GitHub Issue',
    badge: 'REST Payload',
    description: 'Milestones, assignees, labels & markdown body',
    data: GITHUB_ISSUE_SAMPLE
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Order',
    badge: 'Complex Schema',
    description: 'Nested item arrays, UUIDs, customer details & tax totals',
    data: ECOMMERCE_ORDER_SAMPLE
  }
];

