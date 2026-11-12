import type { AssetRef } from "@/render-kit/schema/primitives";
import { createClient } from "@/lib/supabase/client";

export const IMAGE_BUCKET = "portfolio-images";
/** Longest side of a stored image, in pixels. */
export const MAX_SIDE = 2000;
/** Largest file we accept from the device, before shrinking. */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
/** Largest file the storage bucket accepts, after shrinking. */
export const MAX_STORED_BYTES = 5 * 1024 * 1024;

/** The size an image is stored at: the same shape, with the longest side at most MAX_SIDE. */
export function fitWithin(width: number, height: number, max = MAX_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function toWebp(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  for (const quality of [0.86, 0.72, 0.58]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (blob && blob.size <= MAX_STORED_BYTES) return { blob, width, height };
  }
  throw new Error("This image is too large even after shrinking. Try a smaller one.");
}

/**
 * Shrinks an image, converts it to WebP, stores it in the account's folder and records it.
 * Returns the reference a portfolio document keeps.
 */
export async function uploadImage(file: File, portfolioId?: string): Promise<AssetRef> {
  if (!file.type.startsWith("image/"))
    throw new Error("Choose an image file (JPG, PNG, WebP or GIF).");
  if (file.size > MAX_SOURCE_BYTES)
    throw new Error("This file is larger than 25 MB. Choose a smaller image.");

  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Log in to upload images.");

  let converted: Awaited<ReturnType<typeof toWebp>>;
  try {
    converted = await toWebp(file);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("This image")) throw error;
    throw new Error("This file could not be read as an image.");
  }

  const id = crypto.randomUUID();
  const path = `${auth.user.id}/${id}.webp`;
  const stored = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, converted.blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (stored.error) throw new Error(`Upload failed: ${stored.error.message}`);

  await supabase.from("assets").insert({
    id,
    path,
    portfolio_id: portfolioId ?? null,
    width: converted.width,
    height: converted.height,
    size: converted.blob.size,
  });

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return {
    assetId: id,
    url: data.publicUrl,
    alt: "",
    width: converted.width,
    height: converted.height,
  };
}
