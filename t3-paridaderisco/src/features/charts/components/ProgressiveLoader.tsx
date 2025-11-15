"use client";

import React from "react";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Loader2, Clock, Database } from "lucide-react";

interface ProgressiveLoaderProps {
  stage: "connecting" | "fetching" | "processing" | "rendering";
  progress?: number;
  message?: string;
  details?: string;
  estimatedTime?: number;
  className?: string;
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  stage,
  progress,
  message,
  details,
  estimatedTime,
  className = "",
}) => {
  const getStageConfig = (stage: string) => {
    const configs = {
      connecting: {
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
        title: "Conectando...",
        message: message || "Estabelecendo conexão com o servidor",
        color: "text-blue-500",
        bgColor: "bg-primary/10"
      },
      fetching: {
        icon: <Database className="h-5 w-5 animate-pulse" />,
        title: "Buscando Dados...",
        message: message || "Carregando dados históricos dos ativos",
        color: "text-purple-500",
        bgColor: "bg-purple-50"
      },
      processing: {
        icon: <div className="h-5 w-5 bg-orange-500 rounded-full animate-ping" />,
        title: "Processando...",
        message: message || "Calculando estatísticas e normalizando dados",
        color: "text-orange-500",
        bgColor: "bg-orange-50"
      },
      rendering: {
        icon: <div className="h-5 w-5 bg-success/100 rounded animate-pulse" />,
        title: "Renderizando...",
        message: message || "Preparando visualização do gráfico",
        color: "text-green-500",
        bgColor: "bg-success/10"
      }
    };

    return configs[stage as keyof typeof configs] || configs.connecting;
  };

  const config = getStageConfig(stage);
  const progressValue = progress ?? getDefaultProgress(stage);

  return (
    <Card className={`p-6 animate-fade-in-up ${className}`}>
      <div className="space-y-4">
        {/* Header com ícone e título */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${config.bgColor}`}>
            <div className={config.color}>
              {config.icon}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{config.title}</h3>
            <p className="text-sm text-muted-foreground">
              {config.message}
            </p>
          </div>

          {estimatedTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {estimatedTime}s
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progressValue} className="w-full h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(progressValue)}%</span>
            {details && (
              <span className="truncate ml-2">{details}</span>
            )}
          </div>
        </div>

        {/* Stage indicators */}
        <div className="grid grid-cols-4 gap-2">
          {["connecting", "fetching", "processing", "rendering"].map((s, index) => {
            const isActive = s === stage;
            const isCompleted = getStageIndex(stage) > index;
            const isPending = getStageIndex(stage) < index;
            
            return (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? "bg-green-400"
                    : isActive
                    ? "bg-blue-400 animate-pulse"
                    : isPending
                    ? "bg-gray-200"
                    : "bg-gray-200"
                }`}
              />
            );
          })}
        </div>

        {/* Stage labels */}
        <div className="grid grid-cols-4 gap-2 text-xs text-center">
          {[
            { stage: "connecting", label: "Conectar" },
            { stage: "fetching", label: "Buscar" },
            { stage: "processing", label: "Processar" },
            { stage: "rendering", label: "Renderizar" }
          ].map(({ stage: s, label }) => {
            const isActive = s === stage;
            const isCompleted = getStageIndex(stage) > getStageIndex(s);
            
            return (
              <span
                key={s}
                className={`transition-colors duration-300 ${
                  isCompleted
                    ? "text-green-600 font-medium"
                    : isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

function getStageIndex(stage: string): number {
  const stages = ["connecting", "fetching", "processing", "rendering"];
  return stages.indexOf(stage);
}

function getDefaultProgress(stage: string): number {
  const progress = {
    connecting: 25,
    fetching: 50,
    processing: 75,
    rendering: 90
  };
  
  return progress[stage as keyof typeof progress] || 0;
}