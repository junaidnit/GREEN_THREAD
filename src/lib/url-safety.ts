/**
 * SSRF guard for the link analyzer, which fetches a user-supplied URL
 * server-side. Without this, someone could point it at internal services —
 * http://localhost, cloud metadata (169.254.169.254), or private LAN hosts —
 * and use our server as a proxy to reach them. We only allow public http(s).
 *
 * Pure + unit-tested. DNS-rebinding is not fully solvable at the URL layer
 * (a public hostname can resolve to a private IP); this blocks the obvious
 * literal cases, which is the bulk of real abuse.
 */

const PRIVATE_V4: RegExp[] = [
  /^0\./, // "this" network
  /^10\./, // private
  /^127\./, // loopback
  /^169\.254\./, // link-local (incl. cloud metadata 169.254.169.254)
  /^192\.168\./, // private
  /^172\.(1[6-9]|2\d|3[01])\./, // private 172.16–172.31
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT 100.64/10
];

/** Returns the parsed URL if it is safe to fetch, otherwise null. */
export function safeFetchUrl(raw: unknown): URL | null {
  if (typeof raw !== "string" || raw.length > 2048) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (u.username || u.password) return null; // credentials in URL → suspicious

  const host = u.hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (!host) return null;
  if (host === "localhost" || host.endsWith(".localhost")) return null;
  if (host.endsWith(".local") || host.endsWith(".internal")) return null;
  if (host === "0.0.0.0" || host === "::" || host === "::1") return null;
  // IPv6 loopback / link-local (fe80::) / unique-local (fc00::/7 → fc.. or fd..)
  if (/^fe80:/i.test(host) || /^f[cd][0-9a-f]{2}:/i.test(host)) return null;

  // IPv4 literal → block private/loopback/link-local ranges
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    if (PRIVATE_V4.some((re) => re.test(host))) return null;
  }
  return u;
}
