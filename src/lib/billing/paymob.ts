import { createHmac, timingSafeEqual } from "node:crypto";
import type { Currency } from "@/lib/plans";

/** Paymob settings from the environment. Missing values switch the matching currency off. */
export function paymobConfig() {
  const ids = (value: string | undefined) =>
    (value ?? "")
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
  const secretKey = process.env.PAYMOB_SECRET_KEY ?? "";
  const publicKey = process.env.PAYMOB_PUBLIC_KEY ?? "";
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET ?? "";
  const ready = Boolean(secretKey && publicKey && hmacSecret && process.env.SUPABASE_SECRET_KEY);
  const integrations: Record<Currency, number[]> = {
    EGP: ids(process.env.PAYMOB_INTEGRATION_IDS),
    USD: ids(process.env.PAYMOB_USD_INTEGRATION_IDS),
  };
  return {
    secretKey,
    publicKey,
    hmacSecret,
    integrations,
    apiUrl: (process.env.PAYMOB_API_URL || "https://accept.paymob.com").replace(/\/$/, ""),
    checkoutUrl: process.env.PAYMOB_CHECKOUT_URL || "https://eg.checkout.paymob.com/",
    /** Currencies people can pay in right now. */
    currencies: (Object.keys(integrations) as Currency[]).filter(
      (c) => ready && integrations[c].length > 0,
    ),
  };
}

export type IntentionInput = {
  paymentId: string;
  amountCents: number;
  currency: Currency;
  itemName: string;
  email: string;
  name: string;
  notificationUrl: string;
  redirectionUrl: string;
};

/** Starts a Paymob payment and returns the address of Paymob's checkout page. */
export async function createCheckout(
  input: IntentionInput,
): Promise<{ url: string; orderId: string | null }> {
  const config = paymobConfig();
  const [first, ...rest] = (input.name || input.email.split("@")[0]).trim().split(/\s+/);
  const response = await fetch(`${config.apiUrl}/v1/intention/`, {
    method: "POST",
    headers: { authorization: `Token ${config.secretKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      amount: input.amountCents,
      currency: input.currency,
      payment_methods: config.integrations[input.currency],
      items: [
        {
          name: input.itemName,
          amount: input.amountCents,
          description: input.itemName,
          quantity: 1,
        },
      ],
      // Paymob requires these fields; "NA" is its documented value for unknown ones.
      billing_data: {
        first_name: first || "Customer",
        last_name: rest.join(" ") || "NA",
        email: input.email,
        phone_number: "NA",
        apartment: "NA",
        floor: "NA",
        street: "NA",
        building: "NA",
        city: "NA",
        state: "NA",
        country: "EG",
      },
      special_reference: input.paymentId,
      notification_url: input.notificationUrl,
      redirection_url: input.redirectionUrl,
      extras: { payment_id: input.paymentId },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = (await response.json().catch(() => null)) as {
    client_secret?: string;
    intention_order_id?: number;
  } | null;
  if (!response.ok || !body?.client_secret) {
    throw new Error(`Paymob did not start the payment (${response.status})`);
  }
  const url = new URL(config.checkoutUrl);
  url.searchParams.set("publicKey", config.publicKey);
  url.searchParams.set("clientSecret", body.client_secret);
  return {
    url: url.toString(),
    orderId: body.intention_order_id ? String(body.intention_order_id) : null,
  };
}

/** The fields Paymob signs in a "transaction processed" callback, in Paymob's order. */
const SIGNED_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
];

type PaymobObj = Record<string, unknown>;

function read(obj: PaymobObj, path: string): string {
  const value = path
    .split(".")
    .reduce<unknown>((current, key) => (current as PaymobObj | undefined)?.[key], obj);
  if (value === null || value === undefined) return "";
  return String(value);
}

/** The HMAC Paymob sends with a transaction callback (SHA-512 of the signed fields, joined). */
export function transactionHmac(obj: PaymobObj, secret: string): string {
  return createHmac("sha512", secret)
    .update(SIGNED_FIELDS.map((field) => read(obj, field)).join(""))
    .digest("hex");
}

export function isGenuineCallback(obj: PaymobObj, received: string, secret: string): boolean {
  if (!secret || !/^[a-f0-9]{128}$/i.test(received)) return false;
  const expected = Buffer.from(transactionHmac(obj, secret), "hex");
  const given = Buffer.from(received.toLowerCase(), "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** What a genuine callback means for our payment record. */
export function readOutcome(obj: PaymobObj) {
  const order = (obj.order ?? {}) as PaymobObj;
  const claims = ((obj.payment_key_claims ?? {}) as PaymobObj).extra as PaymobObj | undefined;
  const paymentId = String(order.merchant_order_id ?? claims?.payment_id ?? "");
  const finished = obj.pending === false;
  const paid =
    finished && obj.success === true && obj.is_voided !== true && obj.is_refunded !== true;
  return {
    paymentId,
    transactionId: String(obj.id ?? ""),
    amountCents: Number(obj.amount_cents),
    currency: String(obj.currency ?? ""),
    state: paid ? ("paid" as const) : finished ? ("failed" as const) : ("pending" as const),
  };
}
