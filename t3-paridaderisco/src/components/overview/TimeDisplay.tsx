"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";

interface TimeDisplayProps {
  location?: string;
  temperature?: string;
}

export function TimeDisplay({ location, temperature }: TimeDisplayProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("pt-BR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }).toUpperCase()
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted || !currentTime || !currentDate) {
    return (
      <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="text-center">
              <div className="h-6 w-48 mx-auto bg-secondary/50 rounded animate-pulse mb-2" />
              <div className="h-20 w-32 mx-auto bg-secondary/50 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
              {currentDate}
            </div>
            <div className="text-6xl font-bold tracking-tight" suppressHydrationWarning>
              {currentTime}
            </div>
          </div>
          {location && temperature && (
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>{temperature}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{location}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
