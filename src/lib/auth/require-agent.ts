/**
 * lib/auth/require-agent.ts
 * Authenticates a print-agent request via the `X-Agent-Key` header
 * (format: pq_agent_<agentId>.<secret>, see lib/security/agent-key.ts).
 * Updates last_seen_at on every successful call — useful for an
 * "agent offline?" indicator on the owner's dashboard later.
 */

import { NextRequest } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { parseAgentKey, verifyAgentSecret } from "@/lib/security/agent-key";

export type RequireAgentResult =
  | { ok: true; agentId: string; shopId: string }
  | { ok: false; status: number; error: string };

export async function requireAgent(req: NextRequest): Promise<RequireAgentResult> {
  const agentKey = req.headers.get("x-agent-key");
  if (!agentKey) {
    return { ok: false, status: 401, error: "Missing X-Agent-Key header" };
  }

  const parsed = parseAgentKey(agentKey);
  if (!parsed) {
    return { ok: false, status: 401, error: "Malformed agent key" };
  }

  const supabase = getServiceRoleClient();
  const { data: agent, error } = await supabase
    .from("shop_agents")
    .select("id, shop_id, agent_key_hash, active")
    .eq("id", parsed.agentId)
    .single();

  if (error || !agent || !agent.active) {
    return { ok: false, status: 401, error: "Invalid or revoked agent key" };
  }

  const isValid = await verifyAgentSecret(parsed.secret, agent.agent_key_hash);
  if (!isValid) {
    return { ok: false, status: 401, error: "Invalid agent key" };
  }

  // Best-effort heartbeat — don't fail the request if this write fails.
  supabase
    .from("shop_agents")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", agent.id)
    .then(() => {});

  return { ok: true, agentId: agent.id, shopId: agent.shop_id };
}
