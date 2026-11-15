/**
 * Removes everything the load-test seed created: every account whose email is
 * loadtest-…@loadtest.example.com. Deleting an account removes its profile, portfolios, versions,
 * messages, sign-ups, visit counts and payments with it (the tables cascade). Real accounts are
 * never touched: the email check below is the only way an account is chosen.
 *
 *   npm run loadtest:cleanup -- --dry-run    counts what it would remove
 *   npm run loadtest:cleanup                 removes it
 */
import { existsSync, unlinkSync } from "node:fs";
import { adminClient, DATA_FILE, flag, inBatches, isFakeEmail } from "./shared";

async function main() {
  const { db } = adminClient();
  const fake: { id: string; email: string }[] = [];
  let real = 0;
  for (let page = 1; ; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const user of data.users) {
      if (isFakeEmail(user.email)) fake.push({ id: user.id, email: user.email! });
      else real += 1;
    }
    if (data.users.length < 1000) break;
  }
  console.log(`Fake load-test accounts: ${fake.length}. Real accounts (kept): ${real}.`);
  if (flag("dry-run")) {
    console.log("Dry run: nothing was removed.");
    return;
  }

  let removed = 0;
  await inBatches(fake, 8, async (user) => {
    const { error } = await db.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`${user.email}: ${error.message}`);
    removed += 1;
  });
  if (existsSync(DATA_FILE)) unlinkSync(DATA_FILE);
  console.log(`Removed ${removed} accounts and everything they owned.`);
  console.log("Supabase may take a little while to show the smaller database size.");
}

main().catch((error) => {
  console.error("\nCleanup stopped:", error instanceof Error ? error.message : error);
  console.error("Run it again: it only looks for accounts that still exist.");
  process.exit(1);
});
