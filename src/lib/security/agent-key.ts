/**
 * lib/security/agent-key.ts
 * Long-lived device credential for a shop's print agent.
 *
 * Format: `pq_agent_<agentId>.<secret>` — the agentId (a uuid, generated
 * client-side before insert) lets the server look up the exact
 * shop_agents row directly instead of bcrypt-comparing against every
 * agent for a shop. Only the `secret` half needs to be kept hashed;
 * agentId isn't sensitive (it's the row's primary key).
 *
 * The full key is shown to the owner exactly once at creation time and
 * never retrievable again — only its hash is stored.
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export function generateAgentId(): string {
  return crypto.randomUUID();
}

export function generateAgentKey(agentId: string): string {
  const secret = crypto.randomBytes(24).toString("hex");
  return `pq_agent_${agentId}.${secret}`;
}

export function parseAgentKey(key: string): { agentId: string; secret: string } | null {
  const match = key.match(
    /^pq_agent_([0-9a-f-]{36})\.([0-9a-f]{48})$/i
  );
  if (!match) return null;
  return { agentId: match[1], secret: match[2] };
}

export async function hashAgentSecret(secret: string): Promise<string> {
  return bcrypt.hash(secret, SALT_ROUNDS);
}

export async function verifyAgentSecret(secret: string, hash: string): Promise<boolean> {
  return bcrypt.compare(secret, hash);
}
