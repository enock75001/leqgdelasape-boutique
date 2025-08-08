
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications, Notification } from "@/context/notification-context";
import { Activity, Package, ShoppingCart, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const getIconForMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('commande')) {
        return <ShoppingCart className="h-5 w-5 text-blue-500" />;
    }
    if (lowerMessage.includes('produit')) {
        return <Package className="h-5 w-5 text-green-500" />;
    }
    if (lowerMessage.includes('client') || lowerMessage.includes('inscription')) {
        return <UserPlus className="h-5 w-5 text-purple-500" />;
    }
    if (lowerMessage.includes('erreur') || lowerMessage.includes('échec')) {
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    return <Activity className="h-5 w-5 text-gray-500" />;
};


export default function AdminLogsPage() {
  const { notifications, clearNotifications } = useNotifications();

  // Filter only admin notifications
  const adminNotifications = notifications.filter(n => n.recipient === 'admin');

  const handleClearLogs = () => {
    if (confirm("Êtes-vous sûr de vouloir effacer tout l'historique des logs ? Cette action est irréversible.")) {
        clearNotifications('admin');
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Journal d'Activité (Logs)</CardTitle>
                <CardDescription>
                Historique des événements importants du site.
                </CardDescription>
            </div>
            <Button variant="destructive" size="sm" onClick={handleClearLogs} disabled={adminNotifications.length === 0}>
                Effacer l'historique
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[calc(100vh-14rem)]">
            <div className="p-6 pt-0">
            {adminNotifications.length > 0 ? (
                <div className="space-y-4">
                    {adminNotifications.map((notification) => (
                        <div key={notification.id} className={cn(
                            "flex items-start gap-4 p-3 rounded-lg",
                            !notification.read && "bg-primary/5 border border-primary/20"
                        )}>
                            <div className="mt-1">
                                {getIconForMessage(notification.message)}
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm">{notification.message}</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(notification.timestamp).toLocaleString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                    <Activity className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">Aucune activité récente</h3>
                    <p className="text-muted-foreground mt-2">
                    Le journal est vide. Les nouveaux événements apparaîtront ici.
                    </p>
                </div>
            )}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
