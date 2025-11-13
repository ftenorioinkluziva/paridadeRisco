"use client";

import { useState } from "react";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Calendar } from "lucide-react";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangeSelectorProps {
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

type SelectionMode = "month" | "year" | "custom";

const MONTHS = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export function DateRangeSelector({ onDateRangeChange, className = "" }: DateRangeSelectorProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [mode, setMode] = useState<SelectionMode>("month");

  // Month mode states
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toString());
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(currentYear.toString());

  // Year mode state
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());

  // Custom mode states
  const [startMonth, setStartMonth] = useState<string>("1");
  const [startYear, setStartYear] = useState<string>(currentYear.toString());
  const [endMonth, setEndMonth] = useState<string>(currentMonth.toString());
  const [endYear, setEndYear] = useState<string>(currentYear.toString());

  // Generate years (current year and previous 10 years)
  const years = Array.from({ length: 11 }, (_, i) => {
    const year = currentYear - i;
    return { value: year.toString(), label: year.toString() };
  });

  const handleApply = () => {
    let startDate: Date;
    let endDate: Date;

    switch (mode) {
      case "month":
        // For month selection, start at first day and end at last day of month
        startDate = new Date(parseInt(selectedMonthYear), parseInt(selectedMonth) - 1, 1);
        endDate = new Date(parseInt(selectedMonthYear), parseInt(selectedMonth), 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "year":
        // For year selection, start at Jan 1 and end at Dec 31
        startDate = new Date(parseInt(selectedYear), 0, 1);
        endDate = new Date(parseInt(selectedYear), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "custom":
        // Custom range
        startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);
        endDate = new Date(parseInt(endYear), parseInt(endMonth), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    onDateRangeChange({ startDate, endDate });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mode Selection */}
      <div className="flex gap-2">
        <Button
          variant={mode === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("month")}
        >
          Mês Específico
        </Button>
        <Button
          variant={mode === "year" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("year")}
        >
          Ano Completo
        </Button>
        <Button
          variant={mode === "custom" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("custom")}
        >
          Intervalo Customizado
        </Button>
      </div>

      {/* Month Mode */}
      {mode === "month" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Mês</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ano</Label>
            <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Year Mode */}
      {mode === "year" && (
        <div className="space-y-2">
          <Label>Selecione o Ano</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Custom Range Mode */}
      {mode === "custom" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mês Inicial</Label>
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano Inicial</Label>
              <Select value={startYear} onValueChange={setStartYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mês Final</Label>
              <Select value={endMonth} onValueChange={setEndMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano Final</Label>
              <Select value={endYear} onValueChange={setEndYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Apply Button */}
      <Button onClick={handleApply} className="w-full">
        <Calendar className="mr-2 h-4 w-4" />
        Aplicar Período
      </Button>

      {/* Preview */}
      <div className="text-sm text-muted-foreground text-center pt-2 border-t">
        {mode === "month" && (
          <span>
            Período: {MONTHS.find(m => m.value === selectedMonth)?.label}/{selectedMonthYear}
          </span>
        )}
        {mode === "year" && (
          <span>
            Período: Ano de {selectedYear}
          </span>
        )}
        {mode === "custom" && (
          <span>
            Período: {MONTHS.find(m => m.value === startMonth)?.label}/{startYear} até{" "}
            {MONTHS.find(m => m.value === endMonth)?.label}/{endYear}
          </span>
        )}
      </div>
    </div>
  );
}
