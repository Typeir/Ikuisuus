/**
 * @fileoverview Banned IP Manager (Edge Config)
 * @description Manages a list of banned IP ranges stored in Vercel Edge Config.
 * IPs are stored as /24 CIDR ranges so that banning one address blocks the
 * entire local subnet, preventing evasion from the same network.
 *
 * Read operations use the `@vercel/edge-config` SDK (fast edge reads).
 * Write operations go through the Vercel REST API (same pattern as audit logs).
 *
 * @module lib/security/bannedIps
 */

import { logger } from '@/lib/logging/logger';

const log = logger.child({ module: 'BannedIPs' });

/** Edge Config key where the banned IP list is stored. */
const BANNED_IPS_KEY = 'banned_ips';

/** Maximum number of banned ranges to retain (FIFO eviction). */
const MAX_BANNED_RANGES = 2000;

/**
 * A single banned IP range entry.
 *
 * @property {string} range - CIDR /24 range (e.g. "192.168.1.0/24")
 * @property {string} reason - Why this range was banned
 * @property {string} bannedAt - ISO-8601 timestamp
 * @property {string} [sourceIp] - Original IP that triggered the ban
 */
export interface BannedIpEntry {
  /** CIDR /24 range (e.g. "192.168.1.0/24") */
  range: string;
  /** Why this range was banned */
  reason: string;
  /** ISO-8601 timestamp */
  bannedAt: string;
  /** Original IP that triggered the ban */
  sourceIp?: string;
}

/**
 * Converts an IPv4 address to its /24 CIDR range.
 * For IPv6 and mapped addresses, returns the /48 equivalent or the address itself.
 *
 * @param {string} ip - The IP address
 * @returns {string} CIDR range string
 *
 * @example
 * ```ts
 * ipToRange('192.168.1.42'); // "192.168.1.0/24"
 * ipToRange('::ffff:10.0.0.5'); // "10.0.0.0/24"
 * ```
 */
export const ipToRange = (ip: string): string => {
  let normalizedIp = ip;

  if (normalizedIp.startsWith('::ffff:')) {
    normalizedIp = normalizedIp.slice(7);
  }

  const ipv4Parts = normalizedIp.split('.');
  if (ipv4Parts.length === 4) {
    const octets = ipv4Parts.map((p) => parseInt(p, 10));
    if (octets.every((o) => !isNaN(o) && o >= 0 && o <= 255)) {
      return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
    }
  }

  if (normalizedIp.includes(':')) {
    const segments = normalizedIp.split(':').slice(0, 3);
    return `${segments.join(':')}::/48`;
  }

  return `${normalizedIp}/32`;
};

/**
 * Reads the banned IP list from Edge Config.
 *
 * @returns {Promise<BannedIpEntry[]>} Current banned entries or empty array
 */
const readBannedIps = async (): Promise<BannedIpEntry[]> => {
  try {
    const { get } = await import('@vercel/edge-config');
    const data = await get<BannedIpEntry[]>(BANNED_IPS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    log.debug('Edge Config read for banned IPs failed — returning empty', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

/**
 * Writes the banned IP list to Edge Config via the Vercel REST API.
 *
 * @param {BannedIpEntry[]} entries - Full list to persist
 * @returns {Promise<void>}
 */
const writeBannedIps = async (entries: BannedIpEntry[]): Promise<void> => {
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const vercelToken = process.env.VERCEL_API_TOKEN;

  if (!edgeConfigId || !vercelToken) {
    log.debug(
      'EDGE_CONFIG_ID or VERCEL_API_TOKEN not set — banned IP write skipped',
    );
    return;
  }

  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key: BANNED_IPS_KEY,
            value: entries,
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Edge Config banned-IP write failed (${res.status}): ${body}`,
    );
  }
};

/**
 * Checks whether a given IP address falls within any banned range.
 *
 * @param {string} ip - The client IP address to check
 * @returns {Promise<{ banned: boolean; entry?: BannedIpEntry }>}
 *
 * @example
 * ```ts
 * const { banned } = await isIpBanned('192.168.1.42');
 * if (banned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * ```
 */
export const isIpBanned = async (
  ip: string,
): Promise<{ banned: boolean; entry?: BannedIpEntry }> => {
  const range = ipToRange(ip);
  const entries = await readBannedIps();

  const match = entries.find((e) => e.range === range);
  return match ? { banned: true, entry: match } : { banned: false };
};

/**
 * Bans the /24 range containing the given IP address.
 * No-ops if the range is already banned.
 *
 * @param {string} ip - The offending IP address
 * @param {string} reason - Human-readable reason for the ban
 * @returns {Promise<BannedIpEntry>} The created (or existing) ban entry
 *
 * @example
 * ```ts
 * await banIp('10.0.0.5', 'Profanity in correction submission');
 * ```
 */
export const banIp = async (
  ip: string,
  reason: string,
): Promise<BannedIpEntry> => {
  const range = ipToRange(ip);
  const existing = await readBannedIps();

  const alreadyBanned = existing.find((e) => e.range === range);
  if (alreadyBanned) {
    log.message('IP range already banned — skipping write', {
      level: 'warn',
      range,
      ip,
    });
    return alreadyBanned;
  }

  const entry: BannedIpEntry = {
    range,
    reason,
    bannedAt: new Date().toISOString(),
    sourceIp: ip,
  };

  const updated = [entry, ...existing].slice(0, MAX_BANNED_RANGES);

  try {
    await writeBannedIps(updated);
    log.message('IP range banned', {
      level: 'warn',
      range,
      ip,
      reason,
    });
  } catch (error) {
    log.error('Failed to persist IP ban', {
      error: error instanceof Error ? error.message : String(error),
      range,
      ip,
    });
  }

  return entry;
};

/**
 * Removes a banned IP range. Useful for admin un-banning.
 *
 * @param {string} range - The CIDR range to remove (e.g. "192.168.1.0/24")
 * @returns {Promise<boolean>} True if the range was found and removed
 */
export const unbanRange = async (range: string): Promise<boolean> => {
  const existing = await readBannedIps();
  const filtered = existing.filter((e) => e.range !== range);

  if (filtered.length === existing.length) {
    return false;
  }

  try {
    await writeBannedIps(filtered);
    log.message('IP range unbanned', { range });
    return true;
  } catch (error) {
    log.error('Failed to persist IP unban', {
      error: error instanceof Error ? error.message : String(error),
      range,
    });
    return false;
  }
};
