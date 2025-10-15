"use client";

import React from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

interface ErrorBoundaryCardProps {
  error: any;
  retry?: () => void;
  fallback?: string;
  suggestions?: string[];
  className?: string;
}

export const ErrorBoundaryCard: React.FC<ErrorBoundaryCardProps> = ({
  error,
  retry,
  fallback = "Erro ao carregar dados",
  suggestions = [],
  className = "",
}) => {
  const getErrorType = (error: any): string => {
    if (!error) return "unknown";
    
    const message = error.message?.toLowerCase() || "";
    
    if (message.includes("network") || message.includes("fetch")) {
      return "network";
    }
    if (message.includes("timeout")) {
      return "timeout";
    }
    if (message.includes("not found") || message.includes("404")) {
      return "not_found";
    }
    if (message.includes("unauthorized") || message.includes("401")) {
      return "unauthorized";
    }
    if (message.includes("server") || message.includes("500")) {
      return "server";
    }
    
    return "unknown";
  };

  const getErrorConfig = (errorType: string) => {
    const configs = {
      network: {
        title: "Problema de Conexão",
        message: "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
        suggestions: ["Verifique sua conexão com a internet", "Tente novamente em alguns segundos"],
        badge: { text: "Conexão", variant: "destructive" as const }
      },
      timeout: {
        title: "Timeout",
        message: "A requisição demorou mais que o esperado para responder.",
        suggestions: ["Tente um período menor", "Aguarde alguns segundos e tente novamente"],
        badge: { text: "Timeout", variant: "secondary" as const }
      },
      not_found: {
        title: "Dados Não Encontrados",
        message: "Os dados solicitados não foram encontrados no servidor.",
        suggestions: ["Verifique se o ativo selecionado é válido", "Tente selecionar um período diferente"],
        badge: { text: "404", variant: "secondary" as const }
      },
      unauthorized: {
        title: "Acesso Negado",
        message: "Você não tem permissão para acessar estes dados.",
        suggestions: ["Faça login novamente", "Verifique suas credenciais"],
        badge: { text: "Não Autorizado", variant: "destructive" as const }
      },
      server: {
        title: "Erro do Servidor",
        message: "Ocorreu um problema interno no servidor.",
        suggestions: ["Tente novamente em alguns minutos", "Contacte o suporte se o problema persistir"],
        badge: { text: "Servidor", variant: "destructive" as const }
      },
      unknown: {
        title: "Erro Inesperado",
        message: fallback,
        suggestions: suggestions.length > 0 ? suggestions : ["Tente recarregar a página", "Contacte o suporte"],
        badge: { text: "Erro", variant: "secondary" as const }
      }
    };

    return configs[errorType as keyof typeof configs] || configs.unknown;
  };

  const errorType = getErrorType(error);
  const config = getErrorConfig(errorType);
  const allSuggestions = [...new Set([...config.suggestions, ...suggestions])];

  return (
    <Card className={`p-6 animate-fade-in-up ${className}`}>
      <div className="space-y-4">
        {/* Header com ícone e badge */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground">{config.title}</h3>
              <Badge variant={config.badge.variant} className="text-xs">
                {config.badge.text}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {config.message}
            </p>
          </div>
        </div>

        {/* Sugestões */}
        {allSuggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Sugestões:
            </h4>
            <ul className="space-y-1">
              {allSuggestions.slice(0, 3).map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground mt-1.5">•</span>
                  <span className="text-muted-foreground">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detalhes técnicos (desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-xs bg-muted/30 p-3 rounded border">
            <summary className="cursor-pointer font-medium mb-2 text-muted-foreground hover:text-foreground">
              Detalhes Técnicos
            </summary>
            <pre className="whitespace-pre-wrap text-red-600 font-mono">
              {error.stack || error.message || JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {retry && (
            <Button onClick={retry} size="sm" variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Recarregar Página
          </Button>
        </div>
      </div>
    </Card>
  );
};