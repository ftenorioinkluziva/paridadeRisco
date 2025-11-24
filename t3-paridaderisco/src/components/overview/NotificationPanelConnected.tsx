"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Clock, Loader2, Trash2, CheckCheck, AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import { api } from "~/lib/api";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const TYPE_COLORS: Record<NotificationType, string> = {
  INSIGHT: "bg-blue-500/20 text-blue-500",
  WARNING: "bg-orange-500/20 text-orange-500",
  OPPORTUNITY: "bg-green-500/20 text-green-500",
  REBALANCE: "bg-purple-500/20 text-purple-500",
};

const TYPE_DOT_COLORS: Record<NotificationType, string> = {
  INSIGHT: "bg-blue-500",
  WARNING: "bg-orange-500",
  OPPORTUNITY: "bg-green-500",
  REBALANCE: "bg-purple-500",
};

const TYPE_LABELS: Record<NotificationType, string> = {
  INSIGHT: "INSIGHT",
  WARNING: "ALERTA",
  OPPORTUNITY: "OPORTUNIDADE",
  REBALANCE: "REBALANCEAR",
};

const PRIORITY_ICONS: Record<NotificationPriority, React.ReactNode> = {
  HIGH: <AlertCircle className="h-3 w-3" />,
  MEDIUM: null,
  LOW: null,
};

export function NotificationPanelConnected() {
  const utils = api.useUtils();

  // Buscar notificações recentes
  const { data, isLoading } = api.notification.getRecent.useQuery({
    limit: 5,
  });

  // Mutations
  const markAsReadMutation = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getRecent.invalidate();
    },
  });

  const markAllAsReadMutation = api.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getRecent.invalidate();
    },
  });

  const deleteMutation = api.notification.delete.useMutation({
    onSuccess: () => {
      utils.notification.getRecent.invalidate();
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate({ id });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const notifications = data || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                Notificações
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                MARCAR COMO LIDAS
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhuma notificação</p>
              <p className="text-xs mt-1">O agente enviará insights sobre seu portfólio</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 rounded-lg transition-colors space-y-2 group relative",
                      notification.read
                        ? "bg-secondary/30 hover:bg-secondary/50"
                        : "bg-secondary/50 hover:bg-secondary"
                    )}
                  >
                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      onClick={() => handleDelete(notification.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", TYPE_DOT_COLORS[notification.type])} />
                        <h4 className={cn(
                          "font-semibold text-sm",
                          !notification.read && "text-primary"
                        )}>
                          {notification.title}
                        </h4>
                        {notification.priority === 'HIGH' && PRIORITY_ICONS[notification.priority]}
                      </div>
                      <Badge variant="secondary" className={TYPE_COLORS[notification.type]}>
                        {TYPE_LABELS[notification.type]}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed pr-6">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>

                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          Marcar como lida
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
