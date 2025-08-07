
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function AdminLogsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Journal d'Activité (Logs)</CardTitle>
        <CardDescription>
          Cette page affichera bientôt les activités importantes du site, comme les nouvelles commandes, les inscriptions, etc.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-96 text-center">
        <Activity className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">Fonctionnalité en cours de développement</h3>
        <p className="text-muted-foreground mt-2">
          Le système de journalisation des activités sera bientôt disponible ici.
        </p>
      </CardContent>
    </Card>
  );
}
