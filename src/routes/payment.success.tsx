import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useServerFn } from "@tanstack/react-start";
import { syncPaymentStatus } from "@/lib/premium.functions";

export const Route = createFileRoute("/payment/success")({
  head: () => ({
    meta: [
      { title: "Paiement confirmé — OtakuVerse X" },
      { name: "description", content: "Ton accès Premium OtakuVerse X est en cours d'activation." },
      { property: "og:title", content: "Paiement confirmé — OtakuVerse X" },
      { property: "og:description", content: "Ton accès Premium OtakuVerse X est en cours d'activation." },
    ],
  }),
  component: PaymentSuccess,
});

function PaymentSuccess() {
  const { ref } = useSearch({ from: "/payment/success" }) as { ref?: string };
  const sync = useServerFn(syncPaymentStatus);

  const verify = useQuery({
    queryKey: ["payment-verify", ref],
    queryFn: () => (ref ? sync({ data: { paymentId: ref } }) : { status: "pending" as const, premiumExpiresAt: null }),
    enabled: !!ref,
    retry: 2,
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-md mx-auto border-green-500/30">
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
          <CardTitle>Paiement confirmé</CardTitle>
          <CardDescription>
            Kobara a confirmé la transaction. Nous activons ton accès Premium.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {verify.isLoading && <p className="text-muted-foreground">Vérification du statut...</p>}
          {verify.data?.status === "paid" && (
            <p className="text-green-500 font-medium">
              Premium activé jusqu'au {new Date(verify.data.premiumExpiresAt!).toLocaleDateString("fr-FR")}
            </p>
          )}
          {verify.error && <p className="text-destructive text-sm">{verify.error.message}</p>}
          <Button asChild className="w-full">
            <a href="/premium">
              Voir mon abonnement <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
