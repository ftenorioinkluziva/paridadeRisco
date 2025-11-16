"use client";

import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "~/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  badge,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;

    const iconClass = "h-6 w-6";
    switch (trend) {
      case "up":
        return <TrendingUp className={cn(iconClass, "text-green-500")} />;
      case "down":
        return <TrendingDown className={cn(iconClass, "text-red-500")} />;
      case "neutral":
        return <Minus className={cn(iconClass, "text-muted-foreground")} />;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {title}
            </span>
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <div className="text-4xl font-bold tracking-tight">{value}</div>
            {trend && <div>{getTrendIcon()}</div>}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground uppercase tracking-wide">
              {subtitle}
            </p>
          )}
          {badge && <div className="mt-2">{badge}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
