import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { currentUser } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { email_broadcast } from "@/lib/db/schema/email_consent";
import BroadcastComposer from "./BroadcastComposer";
import ReconsentPanel from "./ReconsentPanel";

/**
 * The guard lives here, not in `app/(dashboard)/layout.tsx`, on purpose: that
 * layout skips its session check entirely when `NODE_ENV === "development"`,
 * which would leave the mailer open on every dev machine. Composing a broadcast
 * is the highest-blast-radius screen in the app, so it verifies for itself.
 */
export default async function EmailPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/");

  const recent = await db
    .select({
      id: email_broadcast.id,
      subject: email_broadcast.subject,
      cohort: email_broadcast.cohort,
      status: email_broadcast.status,
      recipient_count: email_broadcast.recipient_count,
      created_at: email_broadcast.created_at,
    })
    .from(email_broadcast)
    .orderBy(desc(email_broadcast.created_at))
    .limit(8);

  return (
    <div className="min-h-screen py-10 px-6 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <h1 className="text-2xl font-black uppercase text-white">Correos</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Envios masivos a quienes confirmaron que querian recibirlos
          </p>
        </div>

        <div className="mb-6">
          <ReconsentPanel />
        </div>

        <BroadcastComposer />

        {recent.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-neutral-500">
              Ultimos envios
            </h2>
            <div className="overflow-hidden rounded-xl border border-white/[0.06]">
              {recent.map((row, index) => (
                <div
                  key={row.id}
                  className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm ${
                    index % 2 === 1 ? "bg-white/[0.02]" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-neutral-300">
                    {row.subject}
                  </span>
                  <span className="text-xs text-neutral-600">{row.cohort}</span>
                  <span className="text-xs text-neutral-500">
                    {row.recipient_count.toLocaleString("es-AR")} destinatarios
                  </span>
                  <span
                    className={`text-xs font-semibold uppercase tracking-widest ${
                      row.status === "sent"
                        ? "text-green-500"
                        : row.status === "failed"
                          ? "text-red-500"
                          : "text-neutral-500"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
