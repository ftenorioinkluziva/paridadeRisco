"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { TrendingUp, Loader2, PlayCircle, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

export function PortfolioAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    insights?: string[];
    notificationsCreated?: number;
  } | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
      });

      const data = await response.json();

      setResult({
        success: response.ok,
        message: data.message || data.error,
        insights: data.data?.insights,
        notificationsCreated: data.data?.notificationsCreated,
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Análise Automática de Portfólio</CardTitle>
            <CardDescription>
              Triggerar o agente para analisar seu portfólio e gerar insights
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Analisar Meu Portfólio
              </>
            )}
          </Button>

          {result && (
            <Badge variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Sucesso
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Erro
                </>
              )}
            </Badge>
          )}
        </div>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <AlertTitle>
              {result.success ? "Análise Completa" : "Erro na Análise"}
            </AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>{result.message}</p>

                {result.insights && result.insights.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-sm mb-2">Insights identificados:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {result.insights.map((insight, index) => (
                        <li key={index}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.success && result.notificationsCreated !== undefined && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    {result.notificationsCreated === 0
                      ? "Nenhuma notificação foi criada (portfólio está em boas condições)"
                      : `${result.notificationsCreated} notificação(ões) criada(s) - confira na página Overview`}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
          <h3 className="font-semibold text-sm">Como funciona:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• O agente analisa seu portfólio completo</li>
            <li>• Calcula o Risk Balance Score</li>
            <li>• Identifica oportunidades de rebalanceamento</li>
            <li>• Gera notificações com insights acionáveis</li>
            <li>• Notificações aparecem na página Overview</li>
          </ul>
        </div>

        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-500/10 p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            💡 <strong>Dica:</strong> Esta análise pode ser agendada para rodar automaticamente
            usando cron jobs ou webhooks no futuro.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
