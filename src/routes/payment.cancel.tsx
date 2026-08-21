import { createFileRoute } from "@tanstack/react-router";
import { XCircle, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/payment/cancel")({
  head: () => ({
    meta: [
      { title: "Paiement annulé — OtakuVerse X" },
      { name: "description", content: "Le paiement a été annulé ou a échoué. Tu peux réessayer quand tu veux." },
      { property: "og:title", content: "Paiement annulé — OtakuVerse X" },
      { property: "og:description", content: "Le paiement a été annulé ou a échoué. Tu peux réessayer quand tu veux." },
    ],
  }),
  component: PaymentCancel,
});

function PaymentCancel() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-md mx-auto border-destructive/30">
        <CardHeader className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-2" />
          <CardTitle>Paiement annulé</CardTitle>
          <CardDescription>
            La transaction n'a pas été finalisée. Aucun montant n'a été débité.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild variant="outline" className="w-full">
            <a href="/premium">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour à Premium
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
