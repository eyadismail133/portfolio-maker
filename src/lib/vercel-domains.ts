/**
 * Connects custom domains to the Vercel project through the Vercel API. Server only. Needs
 * VERCEL_TOKEN (Vercel → Account settings → Tokens) and VERCEL_PROJECT_ID (project → Settings);
 * VERCEL_TEAM_ID when the project belongs to a team.
 */
export function vercelEnabled(): boolean {
  return Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID);
}

async function call(path: string, init: RequestInit = {}) {
  const url = new URL(`https://api.vercel.com${path}`);
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  const response = await fetch(url, {
    ...init,
    headers: {
      authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      "content-type": "application/json",
      ...init.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: response.ok, status: response.status, body };
}

const project = () => encodeURIComponent(process.env.VERCEL_PROJECT_ID ?? "");

/** DNS records the owner must add at their domain registrar. */
export type DnsRecord = { type: string; name: string; value: string };

export type DomainStatus = {
  /** Vercel can serve the domain: DNS points at Vercel and ownership is proven. */
  ready: boolean;
  records: DnsRecord[];
};

function recordsFor(domain: string, verification: unknown): DnsRecord[] {
  const labels = domain.split(".");
  const apex = labels.length === 2;
  const records: DnsRecord[] = apex
    ? [{ type: "A", name: "@", value: "76.76.21.21" }]
    : [{ type: "CNAME", name: labels.slice(0, -2).join("."), value: "cname.vercel-dns.com" }];
  if (Array.isArray(verification)) {
    for (const v of verification as { type?: string; domain?: string; value?: string }[]) {
      if (v.type && v.domain && v.value)
        records.push({
          type: v.type,
          name: v.domain.replace(`.${labels.slice(-2).join(".")}`, ""),
          value: v.value,
        });
    }
  }
  return records;
}

export async function addDomain(
  domain: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const result = await call(`/v10/projects/${project()}/domains`, {
    method: "POST",
    body: JSON.stringify({ name: domain }),
  });
  if (result.ok) return { ok: true };
  const code = String((result.body.error as { code?: string } | undefined)?.code ?? "");
  if (code === "domain_already_in_use" || result.status === 409)
    return { ok: false, reason: "This domain is already connected to another site." };
  if (code === "invalid_domain") return { ok: false, reason: "This domain name is not valid." };
  return { ok: false, reason: "The domain could not be added right now. Try again later." };
}

export async function domainStatus(domain: string): Promise<DomainStatus> {
  const [info, config] = await Promise.all([
    call(`/v9/projects/${project()}/domains/${encodeURIComponent(domain)}`),
    call(`/v6/domains/${encodeURIComponent(domain)}/config`),
  ]);
  const verified = info.ok && info.body.verified === true;
  const misconfigured = !config.ok || config.body.misconfigured === true;
  return {
    ready: verified && !misconfigured,
    records: recordsFor(domain, info.body.verification),
  };
}

export async function removeDomain(domain: string): Promise<void> {
  await call(`/v9/projects/${project()}/domains/${encodeURIComponent(domain)}`, {
    method: "DELETE",
  });
}
