import { createHmac } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { isGenuineCallback, readOutcome, transactionHmac } from "../billing/paymob";
import { COMPARISON, effectivePlan, formatPrice, LIMITS, MONTH_OPTIONS, priceFor } from "../plans";

const SECRET = "test-hmac-secret";
const callback = {
  id: 192036465,
  pending: false,
  amount_cents: 75000,
  success: true,
  is_auth: false,
  is_capture: false,
  is_standalone_payment: true,
  is_voided: false,
  is_refunded: false,
  is_3d_secure: true,
  integration_id: 4567,
  has_parent_transaction: false,
  order: { id: 217503754, merchant_order_id: "6f1d9a4c-1111-4222-8333-444455556666" },
  created_at: "2026-11-13T00:10:00.000000",
  currency: "EGP",
  source_data: { pan: "2346", type: "card", sub_type: "MasterCard" },
  error_occured: false,
  owner: 302852,
};

describe("prices", () => {
  test("250 EGP or 6 USD a month, paid for the months chosen", () => {
    expect(MONTH_OPTIONS).toEqual([1, 3, 6, 12]);
    expect(priceFor(1, "EGP")).toBe(25000);
    expect(priceFor(3, "EGP")).toBe(75000);
    expect(priceFor(12, "USD")).toBe(7200);
    expect(formatPrice(25000, "EGP")).toBe("250 EGP");
    expect(formatPrice(7200, "USD")).toBe("$72");
  });

  test("Pro counts only until its end date; no end date means no end", () => {
    const now = Date.parse("2026-11-13T00:00:00Z");
    expect(effectivePlan("pro", "2026-12-13T00:00:00Z", now)).toBe("pro");
    expect(effectivePlan("pro", "2026-11-12T00:00:00Z", now)).toBe("free");
    expect(effectivePlan("pro", null, now)).toBe("pro");
    expect(effectivePlan("free", "2030-01-01T00:00:00Z", now)).toBe("free");
    expect(effectivePlan(undefined, null, now)).toBe("free");
  });
});

describe("Paymob callbacks", () => {
  test("a correctly signed callback is accepted", () => {
    expect(isGenuineCallback(callback, transactionHmac(callback, SECRET), SECRET)).toBe(true);
  });

  test("a changed amount, a wrong secret or a broken signature is refused", () => {
    const hmac = transactionHmac(callback, SECRET);
    expect(isGenuineCallback({ ...callback, amount_cents: 100 }, hmac, SECRET)).toBe(false);
    expect(isGenuineCallback({ ...callback, success: false }, hmac, SECRET)).toBe(false);
    expect(isGenuineCallback(callback, transactionHmac(callback, "other"), SECRET)).toBe(false);
    expect(isGenuineCallback(callback, "abc", SECRET)).toBe(false);
    expect(isGenuineCallback(callback, hmac, "")).toBe(false);
  });

  test("the signature covers Paymob's fields in Paymob's order", () => {
    const joined =
      "75000" +
      "2026-11-13T00:10:00.000000" +
      "EGP" +
      "false" +
      "false" +
      "192036465" +
      "4567" +
      "true" +
      "false" +
      "false" +
      "false" +
      "true" +
      "false" +
      "217503754" +
      "302852" +
      "false" +
      "2346" +
      "MasterCard" +
      "card" +
      "true";
    expect(transactionHmac(callback, SECRET)).toBe(
      createHmac("sha512", SECRET).update(joined).digest("hex"),
    );
  });

  test("outcomes", () => {
    expect(readOutcome(callback)).toEqual({
      paymentId: callback.order.merchant_order_id,
      transactionId: "192036465",
      amountCents: 75000,
      currency: "EGP",
      state: "paid",
    });
    expect(readOutcome({ ...callback, success: false }).state).toBe("failed");
    expect(readOutcome({ ...callback, pending: true }).state).toBe("pending");
    expect(readOutcome({ ...callback, is_refunded: true }).state).toBe("failed");
    expect(
      readOutcome({
        ...callback,
        order: { id: 1 },
        payment_key_claims: { extra: { payment_id: "from-extras" } },
      }).paymentId,
    ).toBe("from-extras");
  });
});

describe("limits", () => {
  const dir = "supabase/migrations/";
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(dir + f, "utf8"));
  /** The newest migration that (re)defines this function: the one the database runs. */
  const latest = (fn: string) =>
    [...files]
      .reverse()
      .find((sql) => new RegExp(`create (or replace )?function public\\.${fn}\\(`).test(sql)) ?? "";

  test("the app and the database use the same limits", () => {
    const limits = latest("enforce_portfolio_limits");
    expect(limits).toContain(`if existing >= ${LIMITS.portfolios.free} then`);
    expect(limits).toContain(
      `case when pro then ${LIMITS.published.pro} else ${LIMITS.published.free} end`,
    );
    expect(latest("can_upload")).toContain(
      `then ${LIMITS.storageBytes.pro} else ${LIMITS.storageBytes.free} end`,
    );
    expect(latest("trim_portfolio_versions")).toContain(
      `then ${LIMITS.versions.pro} else ${LIMITS.versions.free} end`,
    );
    expect(latest("submit_contact_message")).toContain(
      `this_month >= ${LIMITS.messagesPerMonth.free}`,
    );
    expect(files.join("\n")).toContain("months in (1, 3, 6, 12)");
  });

  test("the comparison table on the Go Pro page names every limit", () => {
    const labels = COMPARISON.map((row) => row.label).join(" | ");
    for (const word of [
      "Portfolios",
      "Published",
      "storage",
      "messages",
      "Version",
      "Download",
      "AI",
      "badge",
    ]) {
      expect(labels).toContain(word);
    }
  });
});
