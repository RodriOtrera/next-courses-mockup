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

/** Every third party that posts signed webhooks at us. */
export type WebhookRail = PaymentRail | "resend";

/** Which surface collected a marketing opt-in — mirrors `emailConsentSourceValues`. */
export type ConsentSource = "signup" | "account" | "footer" | "reconsent" | "preferences";

/** Cohorts a broadcast can target — mirrors `broadcastCohortValues`. */
export type BroadcastAudience =
  | "allUsers"
  | "usersWithCourses"
  | "usersWithEbookProgram"
  | "usersWithCoaching"
  | "test";

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
  /** `resend` is not a payment rail, but a forged webhook is the same class of
   * event and belongs on the same dashboard as the payment ones. */
  webhook_signature_invalid: { rail: WebhookRail };
  webhook_rejected: { rail: WebhookRail; status?: string; reason: string };

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

  // ---- Email consent & broadcasts -----------------------------------------
  /**
   * A confirmation email went out. Pairs with `email_consent_granted` to give
   * the double opt-in conversion rate, which is the number that tells you
   * whether the confirmation copy is working.
   */
  email_consent_requested: { source: ConsentSource };
  /**
   * Consent recorded. `double_opt_in` distinguishes the two legitimate paths:
   * `false` is an authenticated user whose mailbox BetterAuth's OTP already
   * proved, `true` is a confirmation link that was clicked.
   */
  email_consent_granted: { source: ConsentSource; double_opt_in: boolean };
  email_consent_revoked: { source: ConsentSource };
  /** Resend told us a contact unsubscribed, bounced or complained. */
  email_contact_synced: {
    reason: "unsubscribed" | "resubscribed" | "bounced" | "complained" | "deleted";
  };
  /**
   * A broadcast was dispatched. `recipient_count` is the snapshot at send time —
   * cohorts drift, so it cannot be recomputed later.
   */
  broadcast_sent: {
    cohort: BroadcastAudience;
    recipient_count: number;
    scheduled: boolean;
  };
  broadcast_failed: { cohort: BroadcastAudience; reason: string };
}

export type AnalyticsEvent = keyof AnalyticsEventMap;
