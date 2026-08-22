/**
 * GET   /api/profile — the caller's own profile.
 * POST  /api/profile — create the caller's profile row (call once, right
 *                       after supabase.auth.signUp() succeeds client-side).
 * PATCH /api/profile — update own display info.
 *
 * Sign-up/login/password-reset themselves go through the Supabase client
 * SDK directly from the frontend (supabase.auth.signUp /
 * signInWithPassword / resetPasswordForEmail) — that's the standard
 * Supabase pattern and doesn't need a custom backend route. This route
 * only manages the `profiles` row that carries YourPrinter-specific fields
 * (role, phone, avatar) alongside that auth identity.
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

  const supabase = getServiceRoleClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, avatar_url, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

const createProfileSchema = z.object({
  role: z.enum(["student", "owner"]), // 'staff' profiles are created via the staff-invite route, not self-serve
  fullName: z.string().min(1).max(120),
  phone: z.string().min(6).max(20).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();
  if (existing) {
    return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      role: parsed.data.role,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }

  return NextResponse.json({ profile }, { status: 201 });
}

const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  phone: z.string().min(6).max(20).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.fullName) update.full_name = parsed.data.fullName;
  if (parsed.data.phone) update.phone = parsed.data.phone;
  if (parsed.data.avatarUrl) update.avatar_url = parsed.data.avatarUrl;

  const supabase = getServiceRoleClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
