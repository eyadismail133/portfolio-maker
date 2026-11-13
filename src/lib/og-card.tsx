import { ImageResponse } from "next/og";

/**
 * A 1200×630 share card: the big line, a smaller line, and the page's own colors. Used when a
 * published page has no share image of its own, and for the app's home page. Arabic text gets
 * an Arabic font fetched from Google Fonts (the built-in font has no Arabic letters).
 */
export async function shareCard(card: {
  title: string;
  subtitle?: string;
  footer?: string;
  background: string;
  text: string;
  accent: string;
  rtl?: boolean;
}): Promise<ImageResponse> {
  const all = `${card.title}${card.subtitle ?? ""}${card.footer ?? ""}`;
  const fonts = /[؀-ۿ]/.test(all) ? await arabicFont(all) : [];
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: card.background,
        color: card.text,
        direction: card.rtl ? "rtl" : "ltr",
        fontFamily: fonts.length ? "Arabic" : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          width: 120,
          height: 10,
          borderRadius: 999,
          background: card.accent,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "flex",
            fontSize: card.title.length > 28 ? 64 : 84,
            fontWeight: 700,
            lineHeight: 1.08,
          }}
        >
          {card.title}
        </div>
        {card.subtitle && (
          <div style={{ display: "flex", fontSize: 38, opacity: 0.75 }}>{card.subtitle}</div>
        )}
      </div>
      <div style={{ display: "flex", fontSize: 26, opacity: 0.6 }}>{card.footer ?? ""}</div>
    </div>,
    {
      width: 1200,
      height: 630,
      // An empty list would switch off the built-in font, so only pass fonts when there are some.
      ...(fonts.length ? { fonts } : {}),
      headers: { "cache-control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}

async function arabicFont(text: string) {
  try {
    // Latin and Arabic both, because the given fonts replace the built-in one.
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Noto+Sans:wght@700&family=Noto+Sans+Arabic:wght@700&text=${encodeURIComponent(text)}`,
      )
    ).text();
    const urls = [...css.matchAll(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/g)].map(
      (m) => m[1],
    );
    return await Promise.all(
      urls.map(async (url) => ({
        name: "Arabic",
        data: await (await fetch(url)).arrayBuffer(),
        weight: 700 as const,
        style: "normal" as const,
      })),
    );
  } catch {
    return [];
  }
}
