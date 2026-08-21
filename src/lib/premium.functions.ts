import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Lists active Premium plans for public display. */
export const getPremiumPlans = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const { Database } = await import("@/integrations/supabase/types");
  const supabasePublic = createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    },
  );
  const { data, error } = await supabasePublic
    .from("premium_plans")
    .select("id, code, name, description, amount_htg, duration_days")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
});


/** Starts a real Kobara payment (MonCash / NatCash) for a Premium plan. */
export const createPremiumCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { planCode: string; method: "moncash" | "natcash" | "kobara" }) => {
    if (typeof input?.planCode !== "string" || input.planCode.length > 64) {
      throw new Error("Offre invalide.");
    }
    if (!["moncash", "natcash", "kobara"].includes(input?.method)) {
      throw new Error("Moyen de paiement invalide.");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: plan, error: planError } = await supabase
      .from("premium_plans")
      .select("id, code, name, amount_htg, duration_days")
      .eq("code", data.planCode)
      .eq("is_active", true)
      .maybeSingle();
    if (planError) throw planError;
    if (!plan) throw new Error("Offre Premium introuvable.");

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", userId)
      .maybeSingle();

    const origin = new URL(getRequestUrl()).origin;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Create the pending transaction first so a webhook can always find it.
    const { data: row, error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        plan_id: plan.id,
        gateway: "kobara",
        method: data.method,
        amount: plan.amount_htg,
        currency: "HTG",
        status: "pending",
      })
      .select("id")
      .single();
    if (insertError) throw insertError;

    const { createKobaraPayment } = await import("@/lib/kobara.server");
    try {
      const payment = await createKobaraPayment({
        amount: Number(plan.amount_htg),
        description: `OtakuVerse X — ${plan.name}`,
        provider: data.method,
        customer: {
          name: profile?.display_name ?? profile?.username ?? "Membre OtakuVerse X",
          ...(context.claims?.email ? { email: context.claims.email as string } : {}),
        },
        metadata: { payment_id: row.id, user_id: userId, plan_code: plan.code },
        success_url: `${origin}/payment/success?ref=${row.id}`,
        error_url: `${origin}/payment/cancel?ref=${row.id}`,
        webhook_url: `${origin}/api/public/webhooks/kobara`,
        idempotencyKey: row.id,
      });

      await supabaseAdmin
        .from("payments")
        .update({
          kobara_payment_id: payment.id,
          kobara_reference: payment.kobara_reference ?? null,
          checkout_url: payment.checkout_url ?? null,
        })
        .eq("id", row.id);

      return { paymentId: row.id, checkoutUrl: payment.checkout_url as string };
    } catch (error) {
      await supabaseAdmin.from("payments").update({ status: "failed" }).eq("id", row.id);
      throw error;
    }
  });

/**
 * Verifies a payment directly against Kobara and activates Premium when the
 * gateway confirms it. Never trusts the browser landing on a success page.
 */
export const syncPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { paymentId: string }) => {
    if (typeof input?.paymentId !== "string" || !/^[0-9a-f-]{36}$/i.test(input.paymentId)) {
      throw new Error("Référence de paiement invalide.");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("payments")
      .select("id, user_id, plan_id, status, amount, premium_expires_at, kobara_payment_id")
      .eq("id", data.paymentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Paiement introuvable.");

    if (row.status === "paid") {
      return { status: "paid" as const, premiumExpiresAt: row.premium_expires_at };
    }
    if (!row.kobara_payment_id) {
      return { status: row.status as "pending", premiumExpiresAt: null };
    }

    const { fetchKobaraPayment } = await import("@/lib/kobara.server");
    const kobara = await fetchKobaraPayment(row.kobara_payment_id);
    if (!kobara) return { status: "pending" as const, premiumExpiresAt: null };

    const { applyKobaraPaymentState } = await import("@/lib/premium.server");
    return applyKobaraPaymentState(row, kobara);
  });
