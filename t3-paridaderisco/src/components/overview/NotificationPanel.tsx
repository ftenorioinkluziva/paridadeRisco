"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { cn } from "~/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "success" | "info" | "warning";
  badge?: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
}

export function NotificationPanel({
  notifications,
}: NotificationPanelProps) {
  const getBadgeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500/20 text-green-500";
      case "warning":
        return "bg-orange-500/20 text-orange-500";
      case "info":
      default:
        return "bg-blue-500/20 text-blue-500";
    }
  };

  return (
    <div className="space-y-4">
      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                Notificações
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              LIMPAR TUDO
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full",
                      notification.type === "success" ? "bg-green-500" :
                      notification.type === "warning" ? "bg-orange-500" :
                      "bg-blue-500"
                    )} />
                    <h4 className="font-semibold text-sm">{notification.title}</h4>
                  </div>
                  {notification.badge && (
                    <Badge variant="secondary" className={getBadgeColor(notification.type)}>
                      {notification.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {notification.message}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {notification.timestamp}
                </div>
              </div>
            ))}
          </div>
          {notifications.length > 3 && (
            <Button variant="ghost" className="w-full mt-3" size="sm">
              MOSTRAR TODAS ({notifications.length})
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
