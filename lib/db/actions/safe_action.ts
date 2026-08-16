import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";
import { currentUser } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";

/**
 * Unauthenticated client. Every existing action in the repo is built on this and
 * re-checks `currentUser()` by hand, so it is left exactly as it was.
 *
 * New actions should prefer `authAction` / `adminAction` below: a `"use server"`
 * module exports each action as a public RPC endpoint, so "the UI only renders
 * this button for admins" is not an authorization check.
 */
export const action = createSafeActionClient();

/**
 * Errors whose message is safe to show the user.
 *
 * next-safe-action masks thrown errors behind a generic string so internal
 * details never reach the client. That is the right default, but it makes
 * "Unauthorized" indistinguishable from a database outage in the UI, so
 * deliberate, non-revealing messages opt out through this class.
 */
export class ActionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ActionError";
    }
}

const guardedClient = createSafeActionClient({
    handleServerError(e) {
        if (e instanceof ActionError) return e.message;
        console.error("[safe-action]", e);
        return DEFAULT_SERVER_ERROR_MESSAGE;
    },
});

/** Requires a session. Puts the BetterAuth user on `ctx.user`. */
export const authAction = guardedClient.use(async ({ next }) => {
    const user = await currentUser();
    if (!user) throw new ActionError("Necesitas iniciar sesion.");
    return next({ ctx: { user } });
});

/**
 * Requires a session whose email is in `ADMIN_EMAILS`.
 *
 * Sending a broadcast is the highest-blast-radius action in the app; it must
 * never rely on `app/(dashboard)/layout.tsx`, whose session check is skipped
 * when `NODE_ENV === "development"`.
 */
export const adminAction = authAction.use(async ({ next, ctx }) => {
    if (!isAdminEmail(ctx.user.email)) throw new ActionError("No tienes permisos para esta accion.");
    return next({ ctx });
});
