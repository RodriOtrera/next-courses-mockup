import { type ProductType } from "@/lib/db/actions/create_preference";

/**
 * Single source of truth for event names and their payloads.
 *
 * Event names are snake_case and past-tense. Typing them as a union is what
 * stops the taxonomy drifting into `purchase_complete` / `purchaseCompleted` /
 * `purchase_completed` variants that silently split a funnel in three.
 *
 * Anything money-related carries `currency` + `amount` so revenue can be
 * grouped by rail without re-deriving it downstream — the mistake
 * `DashboardStats` currently makes by summing ARS and USD together.
 */

export type PaymentRail = "mercadopago" | "paypal";

/** Where an entitlement came from. `manual` is an admin grant, not a sale. */
export type EnrollmentSource = PaymentRail | "manual";

interface ProductProps {
  product_type: ProductType;
  product_id: string;
  product_name?: string;
}

interface MoneyProps {
  currency: string;
  /** Major units (pesos/dollars), not cents — matches what the rails report. */
  amount: number;
  rail: PaymentRail;
}

export interface AnalyticsEventMap {
  // ---- Revenue funnel -----------------------------------------------------
  /**
   * Top of the funnel: someone looked at a product's detail page.
   *
   * Captured client-side on purpose. Most product-page traffic is anonymous,
   * and a server capture has no distinct ID to attribute those visits to — it
   * would silently measure only logged-in browsing, which is the smaller and
   * less interesting half.
   */
  product_viewed: ProductProps & { price?: number; currency?: string };
  /**
   * Fired client-side at the moment of intent, before leaving for the rail.
   * `price` is what the UI displayed; it's absent on the PayPal path, where the
   * component never receives it and the captured amount is authoritative
   * server-side anyway (see `purchase_completed`).
   */
  checkout_started: ProductProps & {
    rail: PaymentRail;
    currency: string;
    price?: number;
  };
  paypal_order_created: ProductProps & { order_id: string };
  /** Authoritative. Server-side only, exactly once per order. */
  purchase_completed: ProductProps & MoneyProps & { payment_id: string };
  refund_processed: ProductProps & Partial<MoneyProps> & { refund_id: string };

  // ---- Funnel failures ----------------------------------------------------
  /** The buy button is disabled for signed-out users — a measurable blocker. */
  buy_blocked_not_signed_in: ProductProps;
  paypal_sdk_load_failed: { reason?: string };
  /** Captured amount/currency didn't match the order. Fraud or config drift. */
  capture_mismatch: {
    order_id: string;
    expected?: string;
    received?: string;
    reason: string;
  };
  webhook_signature_invalid: { rail: PaymentRail };
  webhook_rejected: { rail: PaymentRail; status?: string; reason: string };

  // ---- Activation ---------------------------------------------------------
  otp_requested: { flow: "login" | "signup" };
  otp_verified: { flow: "login" | "signup" };
  otp_failed: { flow: "login" | "signup"; reason?: string };
  otp_resent: { flow: "login" | "signup" };
  enrollment_granted: ProductProps & { source: EnrollmentSource };

  // ---- Engagement ---------------------------------------------------------
  lesson_completed: {
    course_id: string;
    module_item_id: string;
    progress: number;
  };
  progress_milestone_reached: { course_id: string; milestone: 25 | 50 | 75 };
  course_completed: { course_id: string };
  certificate_issued: { course_id: string };
  /** Clicking a locked lesson is pure purchase intent; today it silently no-ops. */
  locked_lesson_clicked: { course_id: string; module_item_id: string };
  video_play: { course_id?: string; module_item_id?: string; provider: "mux" | "youtube" };
  video_completed: { course_id?: string; module_item_id?: string; provider: "mux" | "youtube" };

  // ---- Gamification -------------------------------------------------------
  /**
   * One per award, so a lesson that also completes its module emits twice.
   * `amount` is the value at award time; `total_xp` is the lifetime total after
   * the whole batch landed, which makes the two safe to sum and to trend
   * independently.
   */
  xp_awarded: {
    source: "lesson" | "module" | "course";
    amount: number;
    total_xp: number;
    level: number;
    course_id: string;
  };
  /** Emitted once per crossing, never on a re-render — the ledger guarantees it. */
  level_up: { from: number; to: number; total_xp: number };
}

export type AnalyticsEvent = keyof AnalyticsEventMap;
