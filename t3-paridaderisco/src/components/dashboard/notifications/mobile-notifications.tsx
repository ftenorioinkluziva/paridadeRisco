"use client";

import * as React from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface MobileNotificationsProps {
  initialNotifications: Notification[];
}

export default function MobileNotifications({
  initialNotifications,
}: MobileNotificationsProps) {
  const [notifications, setNotifications] = React.useState(initialNotifications);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Notificações</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                !notification.read ? "bg-muted/30" : ""
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-sm">{notification.title}</h3>
                {!notification.read && (
                  <div className="h-2 w-2 bg-primary rounded-full" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground">
                {notification.timestamp}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
