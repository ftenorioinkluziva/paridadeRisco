"use client";

import React from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

interface EmptyStateCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  animation?: "fade-up" | "bounce" | "pulse";
  className?: string;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon,
  title,
  description,
  action,
  animation = "fade-up",
  className = "",
}) => {
  const getAnimationClass = () => {
    switch (animation) {
      case "bounce":
        return "animate-bounce";
      case "pulse":
        return "animate-pulse";
      case "fade-up":
      default:
        return "animate-fade-in-up";
    }
  };

  return (
    <Card className={`p-8 ${className}`}>
      <div className={`flex flex-col items-center justify-center text-center space-y-4 ${getAnimationClass()}`}>
        {/* Icon with subtle animation */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full blur-xl opacity-60 animate-pulse" />
          <div className="relative h-16 w-16 flex items-center justify-center text-blue-500 bg-primary/10 rounded-full border border-blue-100">
            <div className="h-8 w-8">
              {icon}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            {description}
          </p>
        </div>
        
        {/* Action button */}
        {action && (
          <div className="pt-2">
            {action}
          </div>
        )}
        
        {/* Decorative elements */}
        <div className="absolute top-4 left-4 w-2 h-2 bg-blue-200 rounded-full opacity-40 animate-pulse" />
        <div className="absolute top-6 right-8 w-1 h-1 bg-purple-200 rounded-full opacity-60 animate-ping" />
        <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-indigo-200 rounded-full opacity-50 animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
    </Card>
  );
};

// Predefined empty states for common scenarios
export const ChartEmptyState: React.FC<{
  type: "single" | "comparison" | "normalized" | undefined;
  onExploreAssets?: () => void;
}> = ({ type, onExploreAssets }) => {
  const configs = {
    single: {
      title: "Selecione um ativo",
      description: "Explore nossa biblioteca de ETFs, ações e índices brasileiros para visualizar dados históricos detalhados",
      action: onExploreAssets ? (
        <Button variant="outline" size="sm" onClick={onExploreAssets}>
          Explorar Ativos
        </Button>
      ) : null
    },
    comparison: {
      title: "Compare múltiplos ativos",
      description: "Selecione de 2 a 10 ativos para comparar suas performances lado a lado com normalização automática",
      action: onExploreAssets ? (
        <Button variant="outline" size="sm" onClick={onExploreAssets}>
          Selecionar Ativos
        </Button>
      ) : null
    },
    normalized: {
      title: "Visualize retorno percentual",
      description: "Escolha um ativo para ver sua performance relativa normalizada baseada no primeiro ponto do período",
      action: null
    }
  };

  // Guard against undefined/invalid runtime values
  const allowedTypes = ["single", "comparison", "normalized"] as const;
  const isValidType = (t: unknown): t is (typeof allowedTypes)[number] =>
    typeof t === "string" && (allowedTypes as readonly string[]).includes(t);

  const safeType = isValidType(type) ? type : "single";
  const config = configs[safeType];
  
  return (
    <EmptyStateCard
      icon={getIconForType(safeType)}
      title={config.title}
      description={config.description}
      action={config.action}
      animation="fade-up"
      className="min-h-96"
    />
  );
};

function getIconForType(type: "single" | "comparison" | "normalized") {
  const icons = {
    single: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    comparison: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    normalized: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
  };
  
  return icons[type];
}
