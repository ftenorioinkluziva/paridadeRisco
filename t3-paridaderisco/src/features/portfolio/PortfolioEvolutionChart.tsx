"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, Loader2 } from "lucide-react";

type PeriodType = "week" | "month" | "year" | "all";

interface PortfolioEvolutionChartProps {
  className?: string;
}

export function PortfolioEvolutionChart({ className }: PortfolioEvolutionChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("all");

  const { data, isLoading, error } = api.portfolio.getPortfolioEvolution.useQuery({
    period: selectedPeriod,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    // Format based on selected period
    if (selectedPeriod === "week") {
      return format(date, "dd/MM", { locale: ptBR });
    } else if (selectedPeriod === "month") {
      return format(date, "dd/MM", { locale: ptBR });
    } else if (selectedPeriod === "year") {
      return format(date, "MMM/yy", { locale: ptBR });
    } else {
      // For "all", show month/year for better readability
      return format(date, "MMM/yy", { locale: ptBR });
    }
  };

  const periods: { value: PeriodType; label: string }[] = [
    { value: "week", label: "SEMANA" },
    { value: "month", label: "MÊS" },
    { value: "year", label: "ANO" },
    { value: "all", label: "TUDO" },
  ];

  // Calculate percentage change
  const calculateChange = () => {
    if (!data?.data || data.data.length < 2) return 0;

    const firstValue = data.data[0]?.value || 0;
    const lastValue = data.data[data.data.length - 1]?.value || 0;

    if (firstValue === 0) return 0;

    return ((lastValue - firstValue) / firstValue) * 100;
  };

  const percentageChange = calculateChange();
  const isPositive = percentageChange >= 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Evolução do Portfólio</CardTitle>
          </div>
          <div className="flex gap-2">
            {periods.map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period.value)}
                className="min-w-[70px]"
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
        <CardDescription>
          Evolução do patrimônio total desde{" "}
          {data?.initialDate
            ? format(new Date(data.initialDate), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })
            : "a primeira transação"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-destructive mb-2">Erro ao carregar dados</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              <p className="text-sm text-muted-foreground mt-2">
                Adicione transações para visualizar a evolução do portfólio
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground mb-1">Valor Atual</p>
                <p className="text-2xl font-bold">{formatCurrency(data.currentValue)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground mb-1">Variação no Período</p>
                <p
                  className={`text-2xl font-bold ${
                    isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {percentageChange.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.data}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    tickFormatter={(value) => {
                      // Format Y-axis as shortened currency (k for thousands)
                      if (value >= 1000000) {
                        return `R$ ${(value / 1000000).toFixed(1)}M`;
                      } else if (value >= 1000) {
                        return `R$ ${(value / 1000).toFixed(0)}k`;
                      }
                      return `R$ ${value.toFixed(0)}`;
                    }}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0]?.payload;
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-lg">
                            <p className="text-sm font-medium mb-1">
                              {format(new Date(data.date), "dd 'de' MMMM 'de' yyyy", {
                                locale: ptBR,
                              })}
                            </p>
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency(data.value)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
