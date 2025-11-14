"use client";

import React from "react";
import { Calendar, Clock } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { DatePicker } from "~/components/ui/date-picker";
import type { TimeRange } from "../types/charts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getStartDateFromRange } from "../utils/calculations";

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomRangeChange?: (startDate: Date, endDate: Date) => void;
  className?: string;
}

const TIME_RANGE_OPTIONS: Array<{
  value: TimeRange;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "30d",
    label: "Últimos 30 dias",
    shortLabel: "30D",
    description: "Evolução do último mês",
  },
  {
    value: "90d",
    label: "Últimos 90 dias",
    shortLabel: "90D", 
    description: "Evolução do último trimestre",
  },
  {
    value: "365d",
    label: "Último ano",
    shortLabel: "1A",
    description: "Evolução dos últimos 12 meses",
  },
  {
    value: "1y",
    label: "1 ano",
    shortLabel: "1Y",
    description: "Dados de 1 ano completo",
  },
  {
    value: "3y",
    label: "3 anos",
    shortLabel: "3Y",
    description: "Dados de 3 anos completos",
  },
  {
    value: "5y",
    label: "5 anos",
    shortLabel: "5Y",
    description: "Dados de 5 anos completos",
  },
];

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  customStartDate,
  customEndDate,
  onCustomRangeChange,
  className = "",
}) => {
  // Calcular período atual
  const currentPeriod = React.useMemo(() => {
    if (selectedRange === "custom" && customStartDate && customEndDate) {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
      };
    }
    
    const endDate = new Date();
    const startDate = getStartDateFromRange(selectedRange, endDate);
    
    return { startDate, endDate };
  }, [selectedRange, customStartDate, customEndDate]);

  // Formatação do período selecionado
  const formatPeriodDisplay = (startDate: Date, endDate: Date): string => {
    const start = format(startDate, "dd/MM/yy", { locale: ptBR });
    const end = format(endDate, "dd/MM/yy", { locale: ptBR });
    
    return `${start} - ${end}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Título e informação do período atual */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-medium">Período</label>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {formatPeriodDisplay(currentPeriod.startDate, currentPeriod.endDate)}
        </div>
      </div>

      {/* Botões de seleção rápida */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {TIME_RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={selectedRange === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onRangeChange(option.value)}
              className="justify-start text-xs"
            >
              <span className="font-medium">{option.shortLabel}</span>
            </Button>
          ))}
        </div>
        
        {/* Botão para range customizado */}
        {onCustomRangeChange && (
          <Button
            variant={selectedRange === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => onRangeChange("custom")}
            className="w-full justify-start text-xs"
          >
            <Calendar className="h-3 w-3 mr-2" />
            Período personalizado
          </Button>
        )}
      </div>

      {/* Informações adicionais sobre o período selecionado */}
      {selectedRange !== "custom" && (
        <Card className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {TIME_RANGE_OPTIONS.find(opt => opt.value === selectedRange)?.label}
              </span>
              <Badge variant="secondary" className="text-xs">
                {TIME_RANGE_OPTIONS.find(opt => opt.value === selectedRange)?.shortLabel}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {TIME_RANGE_OPTIONS.find(opt => opt.value === selectedRange)?.description}
            </p>
          </div>
        </Card>
      )}

      {/* Interface para período customizado */}
      {selectedRange === "custom" && onCustomRangeChange && (
        <Card className="p-3">
          <div className="space-y-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período Personalizado
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Data Início
                </label>
                <DatePicker
                  date={customStartDate}
                  onDateChange={(date) => {
                    if (date && customEndDate) {
                      onCustomRangeChange(date, customEndDate);
                    } else if (date) {
                      // Se não tem data fim ainda, define como hoje
                      onCustomRangeChange(date, new Date());
                    }
                  }}
                  placeholder="Selecione a data inicial"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Data Fim
                </label>
                <DatePicker
                  date={customEndDate}
                  onDateChange={(date) => {
                    if (date && customStartDate) {
                      onCustomRangeChange(customStartDate, date);
                    } else if (date) {
                      // Se não tem data início ainda, define como 1 ano atrás
                      const oneYearAgo = new Date(date);
                      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                      onCustomRangeChange(oneYearAgo, date);
                    }
                  }}
                  placeholder="Selecione a data final"
                  className="h-9 text-sm"
                />
              </div>
            </div>
            
            {customStartDate && customEndDate && (
              <div className="text-xs text-muted-foreground">
                Período selecionado: {formatPeriodDisplay(customStartDate, customEndDate)}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};