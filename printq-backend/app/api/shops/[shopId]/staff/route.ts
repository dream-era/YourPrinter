/**
 * GET  /api/shops/[shopId]/staff — list staff (owner only)
 * POST /api/shops/[shopId]/staff — invite a new staff member (owner only)
 *
 * Staff don't sign up themselves. The owner sets a name, phone, role, and
 * initial PIN. Under the hood this creates a minimal Supabase Auth user
 * (synthetic email, random unusable password — nobody logs in with it) so
 * the staff member has a real `profiles.id` that existing foreign keys
 * (order_status_history.changed_by, orders.assigned_staff_id) can reference
 * consistently with owners and students. Actual staff login is PIN-only,
 * via POST /api/auth/staff-login.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { requireShopOwner } from "@/lib/auth/require-shop-owner";
import { hashPin } from "@/lib/security/pin";

export async function GET(req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const authResult = await requireShopOwner(req, params.shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = getServiceRoleClient();
  const { data: staff, error } = await supabase
    .from("shop_staff")
    .select("id, display_name, phone, role, active, last_login_at, created_at")
    .eq("shop_id", params.shopId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load staff" }, { status: 500 });
  }

  return NextResponse.json({ staff });
}

const inviteStaffSchema = z.object({
  displayName: z.string().min(1).max(120),
  phone: z.string().min(6).max(20),
  role: z.enum(["manager", "printer_operator", "cashier"]),
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
});

export async function POST(req: NextRequest, props: { params: Promise<{ shopId: string }> }) {
  const params = await props.params;
  const authResult = await requireShopOwner(req, params.shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = inviteStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { displayName, phone, role, pin } = parsed.data;

  const supabase = getServiceRoleClient();

  // Enforce uniqueness explicitly first for a clean error message (the DB
  // unique index also guards this, but its error message is less friendly).
  const { data: existingStaff } = await supabase
    .from("shop_staff")
    .select("id")
    .eq("shop_id", params.shopId)
    .eq("phone", phone)
    .single();
  if (existingStaff) {
    return NextResponse.json(
      { error: "A staff member with this phone number already exists at this shop" },
      { status: 409 }
    );
  }

  // Create a minimal auth identity so this staff member has a real profiles.id.
  // Synthetic email + random password: nobody ever logs in with these directly.
  const syntheticEmail = `staff+${randomUUID()}@printq.internal`;
  const randomPassword = randomUUID() + randomUUID();

  const { data: createdUser, error: createUserError } =
    await supabase.auth.admin.createUser({
      email: syntheticEmail,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { synthetic: true, purpose: "shop_staff" },
    });

  if (createUserError || !createdUser?.user) {
    return NextResponse.json(
      { error: "Failed to create staff identity", details: createUserError?.message },
      { status: 500 }
    );
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: createdUser.user.id,
    role: "staff",
    full_name: displayName,
    phone,
  });

  if (profileError) {
    // Roll back the orphaned auth user so we don't accumulate junk accounts.
    await supabase.auth.admin.deleteUser(createdUser.user.id);
    return NextResponse.json({ error: "Failed to create staff profile" }, { status: 500 });
  }

  const pinHash = await hashPin(pin);

  const { data: staffRow, error: staffError } = await supabase
    .from("shop_staff")
    .insert({
      shop_id: params.shopId,
      user_id: createdUser.user.id,
      role,
      display_name: displayName,
      phone,
      pin_hash: pinHash,
      invited_by: authResult.userId,
      active: true,
    })
    .select("id, display_name, phone, role, active, created_at")
    .single();

  if (staffError) {
    await supabase.auth.admin.deleteUser(createdUser.user.id);
    await supabase.from("profiles").delete().eq("id", createdUser.user.id);
    return NextResponse.json({ error: "Failed to add staff member" }, { status: 500 });
  }

  return NextResponse.json({ staff: staffRow }, { status: 201 });
}
