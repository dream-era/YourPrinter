import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { calculateOrderPrice } from "@/lib/pricing/calculate";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.shopId || !body.documentId || !body.printOptions) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const priceBreakdown = await calculateOrderPrice(
      body.shopId,
      body.documentId,
      body.printOptions
    );
    
    return NextResponse.json(priceBreakdown);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to calculate price" }, { status: 500 });
  }
}
