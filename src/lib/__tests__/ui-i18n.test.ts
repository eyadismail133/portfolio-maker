import { describe, expect, test } from "vitest";
import { AR_1 } from "../i18n/ar-1";
import { AR_2 } from "../i18n/ar-2";
import { isPortfolioPath, translateUi } from "../i18n/ui";

describe("Arabic interface", () => {
  test("known texts are translated, keeping the spaces around them", () => {
    expect(translateUi("Log in")).toBe("تسجيل الدخول");
    expect(translateUi("  My portfolios ")).toBe(" ملفاتي ");
    expect(translateUi("Go Pro to read it\n   and every message")).toBeNull();
    expect(translateUi("12")).toBeNull();
  });

  test("texts with numbers and names", () => {
    expect(translateUi("Question 3 of 8")).toBe("السؤال 3 من 8");
    expect(translateUi("3 months")).toBe("3 أشهر");
    expect(translateUi("1 month")).toBe("شهر واحد");
    expect(translateUi("Minimal design, cobalt colors, second layouts")).toBe(
      "تصميم بسيط، ألوان كوبالت، تخطيطات بديلة",
    );
    expect(translateUi("Software and IT")).toBe("البرمجيات وتقنية المعلومات");
  });

  test("every entry has Arabic text and no entry is listed twice", () => {
    const keys = [...Object.keys(AR_1), ...Object.keys(AR_2)];
    expect(new Set(keys).size).toBe(keys.length);
    for (const [en, ar] of Object.entries({ ...AR_1, ...AR_2 })) {
      expect(ar.trim(), en).not.toBe("");
      expect(/[؀-ۿ]/.test(ar) || /^[\d\s.,·→←]+$/.test(ar), en).toBe(true);
    }
  });

  test("portfolio pages never follow the interface language", () => {
    expect(isPortfolioPath("/p/layla")).toBe(true);
    expect(isPortfolioPath("/preview")).toBe(true);
    expect(isPortfolioPath("/dashboard")).toBe(false);
    expect(isPortfolioPath("/pro")).toBe(false);
  });
});
