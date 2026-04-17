"use client";

import { GoalsWidget } from "@/components/dashboard/goals-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Rocket, Target } from "lucide-react";
import { useState } from "react";

interface GoalsPageClientProps {
  initialGoals: any[];
}

export function GoalsPageClient({ initialGoals }: GoalsPageClientProps) {
  const [goals, setGoals] = useState(initialGoals);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {goals.length > 0 ? (
          goals.map((goal) => (
            <div key={goal.id} className="lg:col-span-1">
              <GoalsWidget goals={[goal]} />
            </div>
          ))
        ) : (
          <Card className="col-span-full py-20">
            <CardContent className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-muted rounded-full p-4">
                <Target className="text-muted-foreground h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">Qual seu próximo sonho?</h3>
                <p className="text-muted-foreground mx-auto max-w-xs">
                  Seja uma reserva de emergência, uma viagem ou um novo carro, definir metas é o
                  primeiro passo para conquistar.
                </p>
              </div>
              <Button variant="outline" className="mt-4 gap-2">
                <Rocket className="h-4 w-4" />
                Criar minha primeira meta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
