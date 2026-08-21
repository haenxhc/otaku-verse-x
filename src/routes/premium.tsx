import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Crown, Play, Sparkles, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { createPremiumCheckout, getPremiumPlans } from "@/lib/premium.functions";
import { useServerFn } from "@tanstack/react-start";
import type { Database } from "@/integrations/supabase/types";

type Plan = Pick<
  Database["public"]["Tables"]["premium_plans"]["Row"],
  "id" | "code" | "name" | "description" | "amount_htg" | "duration_days"
>;

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Premium — OtakuVerse X" },
      { name: "description", content: "Débloque le streaming illimité et les avantages Premium sur OtakuVerse X." },
      { property: "og:title", content: "Premium — OtakuVerse X" },
      { property: "og:description", content: "Débloque le streaming illimité et les avantages Premium sur OtakuVerse X." },
    ],
  }),
  component: PremiumPage,
});

function PremiumPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const checkout = useServerFn(createPremiumCheckout);
  const listPlans = useServerFn(getPremiumPlans);
  const [selectedMethod, setSelectedMethod] = useState<"moncash" | "natcash" | "kobara">("moncash");

  const plansQuery = useQuery({
    queryKey: ["premium-plans"],
    queryFn: () => listPlans(),
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ planCode }: { planCode: string }) => {
      return checkout({ data: { planCode, method: selectedMethod } });
    },
    onSuccess: (data) => {
      if (data?.checkoutUrl) window.location.href = data.checkoutUrl;
    },
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Crown className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-3xl font-bold mb-2">OtakuVerse X Premium</h1>
        <p className="text-muted-foreground mb-6">Connecte-toi pour activer ton accès Premium.</p>
        <Button onClick={() => navigate({ to: "/login" })}>Se connecter</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">Paiement sécurisé par Kobara</Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Passe Premium</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Streaming HD, nouveaux épisodes en avant-première, pas de publicité, et historique de visionnage synchronisé.
        </p>
      </div>

      {plansQuery.isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plansQuery.data?.map((plan: Plan) => (
          <Card key={plan.code} className="border-2 border-primary/20 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                {plan.name}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-3xl font-bold">
                {Number(plan.amount_htg).toLocaleString("fr-FR")} HTG
                <span className="text-sm font-normal text-muted-foreground"> / {plan.duration_days} j</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Streaming illimité</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Nouveaux épisodes en priorité</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Pas de publicité</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Historique multi-appareils</li>
              </ul>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Moyen de paiement</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["moncash", "natcash", "kobara"] as const).map((m) => (
                    <Button
                      key={m}
                      variant={selectedMethod === m ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMethod(m)}
                      className="capitalize"
                    >
                      {m}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => checkoutMutation.mutate({ planCode: plan.code })}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? (
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Activer maintenant
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {checkoutMutation.error && (
        <p className="text-center text-destructive mt-8">{checkoutMutation.error.message}</p>
      )}
    </div>
  );
}

