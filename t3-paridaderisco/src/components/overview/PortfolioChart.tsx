"use client";

import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { useState } from "react";
import { api } from "~/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PortfolioChartProps {
  title: string;
}

type TimeRange = "week" | "month" | "year" | "all";

export function PortfolioChart({ title }: PortfolioChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const { data, isLoading, error } = api.portfolio.getPortfolioEvolution.useQuery({
    period: timeRange,
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    if (timeRange === "week") {
      return format(date, "dd/MM", { locale: ptBR });
    } else if (timeRange === "month") {
      return format(date, "dd/MM", { locale: ptBR });
    } else if (timeRange === "year") {
      return format(date, "MMM/yy", { locale: ptBR });
    } else {
      return format(date, "MMM/yy", { locale: ptBR });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              {title}
            </h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeRange === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("week")}
            >
              SEMANA
            </Button>
            <Button
              variant={timeRange === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("month")}
            >
              MÊS
            </Button>
            <Button
              variant={timeRange === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("year")}
            >
              ANO
            </Button>
            <Button
              variant={timeRange === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("all")}
            >
              TUDO
            </Button>
          </div>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-xs uppercase">Valor do Portfólio</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-center">
              <p className="text-destructive mb-2">Erro ao carregar dados</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              <p className="text-sm text-muted-foreground mt-2">
                Adicione transações para visualizar a evolução do portfólio
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.data}>
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
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                stroke="#9ca3af"
                tickLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `R$ ${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `R$ ${(value / 1000).toFixed(0)}k`;
                  }
                  return `R$ ${value.toFixed(0)}`;
                }}
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
        )}
      </CardContent>
    </Card>
  );
}
