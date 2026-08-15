/**
 * lib/orders/state-machine.ts
 * Single source of truth for which order status transitions are legal.
 * Every route that changes order.status must go through assertTransition()
 * rather than writing status directly, so the rules can't drift between
 * the payment webhook, the staff dashboard route, and the pickup route.
 */

export type OrderStatus =
  | "pending_payment"
  | "accepted"
  | "printing"
  | "ready"
  | "completed"
  | "cancelled"
  | "failed";

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["accepted", "failed", "cancelled"],
  accepted: ["printing", "cancelled"],
  printing: ["ready", "cancelled"], // cancelling mid-print should be rare; UI should warn
  ready: ["completed", "cancelled"], // e.g. student never shows up
  completed: [], // terminal
  cancelled: [], // terminal
  failed: [], // terminal
};

export class InvalidTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Cannot transition order from '${from}' to '${to}'`);
    this.name = "InvalidTransitionError";
  }
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new InvalidTransitionError(from, to);
  }
}

/** Returns the timestamp column that should be stamped for a given status, if any. */
export function timestampColumnFor(status: OrderStatus): string | null {
  switch (status) {
    case "accepted":
      return "accepted_at";
    case "printing":
      return "printing_started_at";
    case "ready":
      return "ready_at";
    case "completed":
      return "completed_at";
    case "cancelled":
      return "cancelled_at";
    default:
      return null;
  }
}
