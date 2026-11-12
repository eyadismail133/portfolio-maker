import { NextResponse } from "next/server";
import { IMAGE_BUCKET } from "@/lib/upload";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Deletes the signed-in account for good: its images, then the account itself, which removes
 * every portfolio, message, version and payment record with it (the tables cascade).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { confirm?: string } | null;
  if (body?.confirm !== "delete") return NextResponse.json({ error: "confirm" }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "setup" }, { status: 503 });
  }

  // Images first: storage files are not removed with the account.
  const folder = user.id;
  for (;;) {
    const { data: files, error } = await admin.storage
      .from(IMAGE_BUCKET)
      .list(folder, { limit: 100 });
    if (error || !files || files.length === 0) break;
    const { error: removeError } = await admin.storage
      .from(IMAGE_BUCKET)
      .remove(files.map((f) => `${folder}/${f.name}`));
    if (removeError) break;
    if (files.length < 100) break;
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "failed" }, { status: 502 });
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
