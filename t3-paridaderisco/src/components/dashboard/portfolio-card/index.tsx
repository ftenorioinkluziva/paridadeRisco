import React from "react";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";

interface PortfolioCardProps {
  label: string;
  value: string;
  description?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ComponentType<{ className?: string }>;
}

export default function PortfolioCard({
  label,
  value,
  description,
  change,
  changeType = "neutral",
  icon: Icon,
}: PortfolioCardProps) {
  const changeColor = {
    positive: "text-green-500",
    negative: "text-red-500",
    neutral: "text-gray-400",
  };

  return (
    <Card className="p-6 bg-card border border-border/50 hover:border-border transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {label}
          </p>
          <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {change && (
            <p
              className={cn(
                "text-sm font-medium mt-2",
                changeColor[changeType]
              )}
            >
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="ml-4">
            <Icon className="w-8 h-8 text-muted-foreground/50" />
          </div>
        )}
      </div>
    </Card>
  );
}
