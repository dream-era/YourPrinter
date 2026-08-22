/**
 * GET /api/notifications — the caller's own notifications, most recent first.
 * PATCH /api/notifications — body: { notificationIds: string[] } marks read.
 *
 * Real-time push doesn't need any code here — clients subscribe directly to
 * Supabase Realtime on the `notifications` table filtered by
 * `user_id=eq.<their id>`. This route is for the initial list load and for
 * marking things read.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 30), 100);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const supabase = getServiceRoleClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.is("read_at", null);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }

  return NextResponse.json({ notifications: data });
}

const markReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1).max(100),
});

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id) // guard: can only mark your own notifications read
    .in("id", parsed.data.notificationIds);

  if (error) {
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
