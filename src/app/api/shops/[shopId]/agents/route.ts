/**
 * POST /api/shops/[shopId]/agents — register a new print agent (owner only).
 * Returns the plaintext key EXACTLY ONCE — this response is the only time
 * it's ever visible. The owner pastes it into the print-agent's config file
 * on the shop's PC during setup.
 *
 * GET /api/shops/[shopId]/agents — list agents (key hash never included).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { requireShopOwner } from "@/lib/auth/require-shop-owner";
import { generateAgentId, generateAgentKey, hashAgentSecret, parseAgentKey } from "@/lib/security/agent-key";

export async function GET(req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const authResult = await requireShopOwner(req, params.shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = getServiceRoleClient();
  const { data: agents, error } = await supabase
    .from("shop_agents")
    .select("id, name, active, last_seen_at, created_at")
    .eq("shop_id", params.shopId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load agents" }, { status: 500 });
  }

  return NextResponse.json({ agents });
}

const registerAgentSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function POST(req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const authResult = await requireShopOwner(req, params.shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const agentId = generateAgentId();
  const plaintextKey = generateAgentKey(agentId);
  const { secret } = parseAgentKey(plaintextKey)!;
  const keyHash = await hashAgentSecret(secret);

  const supabase = getServiceRoleClient();
  const { data: agent, error } = await supabase
    .from("shop_agents")
    .insert({
      id: agentId,
      shop_id: params.shopId,
      name: parsed.data.name,
      agent_key_hash: keyHash,
      active: true,
    })
    .select("id, name, active, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to register agent" }, { status: 500 });
  }

  return NextResponse.json(
    {
      agent,
      agentKey: plaintextKey, // shown once — instruct the owner to save it now
      warning: "This key will not be shown again. Paste it into the print agent's config now.",
    },
    { status: 201 }
  );
}
