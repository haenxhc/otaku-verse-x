/**
 * Server-only Premium activation logic. Shared by the payment sync server
 * function and the Kobara webhook route so a payment is only ever activated
 * from a state confirmed by Kobara itself.
 */
import { mapKobaraStatus, normalizeMethod, type KobaraPayment } from "@/lib/kobara.server";

export interface PaymentRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: string;
  amount: number;
  premium_expires_at: string | null;
}

export interface ApplyResult {
  status: "pending" | "paid" | "failed" | "expired" | "cancelled";
  premiumExpiresAt: string | null;
}

/**
 * Applies a Kobara payment state to our database. Activates or extends Premium
 * only when Kobara reports the payment as succeeded. Idempotent: a payment that
 * is already `paid` is never counted twice.
 */
export async function applyKobaraPaymentState(
  payment: PaymentRow,
  kobara: KobaraPayment,
): Promise<ApplyResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const status = mapKobaraStatus(kobara.status);

  if (payment.status === "paid") {
    return { status: "paid", premiumExpiresAt: payment.premium_expires_at };
  }

  if (status !== "paid") {
    await supabaseAdmin
      .from("payments")
      .update({
        status,
        method: normalizeMethod(kobara.provider ?? kobara.payment_method),
        kobara_reference: kobara.kobara_reference ?? null,
      })
      .eq("id", payment.id);
    return { status, premiumExpiresAt: null };
  }

  // Confirmed paid → compute the new Premium period.
  let durationDays = 30;
  if (payment.plan_id) {
    const { data: plan } = await supabaseAdmin
      .from("premium_plans")
      .select("duration_days")
      .eq("id", payment.plan_id)
      .maybeSingle();
    if (plan?.duration_days) durationDays = plan.duration_days;
  }

  const { data: sub } = await supabaseAdmin
    .from("premium_subscriptions")
    .select("current_period_end")
    .eq("user_id", payment.user_id)
    .maybeSingle();

  const now = Date.now();
  const base =
    sub?.current_period_end && new Date(sub.current_period_end).getTime() > now
      ? new Date(sub.current_period_end).getTime()
      : now;
  const periodEnd = new Date(base + durationDays * 24 * 60 * 60 * 1000).toISOString();

  const { error: payErr } = await supabaseAdmin
    .from("payments")
    .update({
      status: "paid",
      method: normalizeMethod(kobara.provider ?? kobara.payment_method),
      kobara_reference: kobara.kobara_reference ?? null,
      provider_transaction_id: kobara.MonCash_transaction_id ?? kobara.transaction_id ?? null,
      paid_at: kobara.paid_at ?? new Date().toISOString(),
      premium_expires_at: periodEnd,
    })
    .eq("id", payment.id)
    .neq("status", "paid");
  if (payErr) throw payErr;

  const { error: subErr } = await supabaseAdmin.from("premium_subscriptions").upsert(
    {
      user_id: payment.user_id,
      plan_id: payment.plan_id,
      last_payment_id: payment.id,
      current_period_end: periodEnd,
    },
    { onConflict: "user_id" },
  );
  if (subErr) throw subErr;

  await supabaseAdmin.from("notifications").insert({
    user_id: payment.user_id,
    type: "premium",
    title: "Premium activé",
    body: `Votre accès Premium est actif jusqu'au ${new Date(periodEnd).toLocaleDateString("fr-FR")}.`,
    link: "/premium",
  });

  return { status: "paid", premiumExpiresAt: periodEnd };
}
