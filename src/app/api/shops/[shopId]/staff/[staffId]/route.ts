/**
 * PATCH  /api/shops/[shopId]/staff/[staffId] — update role, active status, or reset PIN
 * DELETE /api/shops/[shopId]/staff/[staffId] — remove (soft-delete: sets active=false)
 *
 * Owner only. A reset PIN or active=false immediately invalidates that
 * staff member's ability to pass requireShopAccess, even before their
 * current JWT naturally expires (it re-checks `active` on every request).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { requireShopOwner } from "@/lib/auth/require-shop-owner";
import { hashPin } from "@/lib/security/pin";

const updateStaffSchema = z.object({
  role: z.enum(["manager", "printer_operator", "cashier"]).optional(),
  active: z.boolean().optional(),
  newPin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits").optional(),
  displayName: z.string().min(1).max(120).optional(),
});

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ shopId: string; staffId: string }> }
) {
  const params = await props.params;
  const authResult = await requireShopOwner(req, params.shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.role) update.role = parsed.data.role;
  if (parsed.data.active !== undefined) update.active = parsed.data.active;
  if (parsed.data.displayName) update.display_name = parsed.data.displayName;
  if (parsed.data.newPin) update.pin_hash = await hashPin(parsed.data.newPin);

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();
  const { data: staffRow, error } = await supabase
    .from("shop_staff")
    .update(update)
    .eq("id", params.staffId)
    .eq("shop_id", params.shopId) // guard: can't touch another shop's staff row by id alone
    .select("id, display_name, phone, role, active, created_at")
    .single();

  if (error || !staffRow) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  // Keep the display name in profiles consistent if it changed here.
  if (parsed.data.displayName) {
    const { data: fullRow } = await supabase
      .from("shop_staff")
      .select("user_id")
      .eq("id", params.staffId)
      .single();
    if (fullRow?.user_id) {
      await supabase
        .from("profiles")
        .update({ full_name: parsed.data.displayName })
        .eq("id", fullRow.user_id);
    }
  }

  return NextResponse.json({ staff: staffRow });
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ shopId: string; staffId: string }> }
) {
  const params = await props.params;
  const authResult = await requireShopOwner(req, params.shopId);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = getServiceRoleClient();

  // Soft-delete only — a hard delete would null out changed_by references
  // in order_status_history and assigned_staff_id on past orders, losing
  // audit trail. `active = false` is enough to revoke access.
  const { data: staffRow, error } = await supabase
    .from("shop_staff")
    .update({ active: false })
    .eq("id", params.staffId)
    .eq("shop_id", params.shopId)
    .select("id")
    .single();

  if (error || !staffRow) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
