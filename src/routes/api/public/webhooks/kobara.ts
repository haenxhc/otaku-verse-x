import { createFileRoute } from "@tanstack/react-router";
import { verifyKobaraSignature } from "@/lib/kobara.server";

export const Route = createFileRoute("/api/public/webhooks/kobara")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("Kobara-Signature");
        const timestamp = request.headers.get("Kobara-Timestamp");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Log the event for audit and replay protection before processing.
        const event = await request.json().catch(() => ({}));
        const { data: eventRow } = await supabaseAdmin
          .from("kobara_webhook_events")
          .insert({
            event_id: event?.id ?? null,
            event_type: event?.type ?? "unknown",
            payment_id: event?.data?.payment_id ?? event?.data?.id ?? null,
            payload: event,
            processed: false,
          })
          .select("id")
          .single();

        if (!verifyKobaraSignature(rawBody, signature, timestamp)) {
          console.error("Kobara webhook signature mismatch", { eventId: event?.id });
          return new Response("Invalid signature", { status: 401 });
        }

        const paymentId = event?.data?.payment_id ?? event?.data?.id;
        if (!paymentId || typeof paymentId !== "string") {
          return new Response("Missing payment id", { status: 400 });
        }

        const { fetchKobaraPayment, mapKobaraStatus } = await import("@/lib/kobara.server");
        const { applyKobaraPaymentState } = await import("@/lib/premium.server");

        const kobara = await fetchKobaraPayment(paymentId);
        if (!kobara) {
          return new Response("Payment not found on Kobara", { status: 404 });
        }

        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("id, user_id, plan_id, status, amount, premium_expires_at, kobara_payment_id")
          .eq("kobara_payment_id", paymentId)
          .maybeSingle();

        if (!payment) {
          return new Response("Payment not linked", { status: 404 });
        }

        if (payment.status === "paid") {
          await supabaseAdmin
            .from("kobara_webhook_events")
            .update({ processed: true })
            .eq("id", eventRow?.id ?? "");
          return new Response("Already processed", { status: 200 });
        }

        await applyKobaraPaymentState(payment, kobara);

        await supabaseAdmin
          .from("kobara_webhook_events")
          .update({ processed: true })
          .eq("id", eventRow?.id ?? "");

        return new Response("ok", { status: 200 });
      },
    },
  },
});
