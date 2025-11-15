import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Progress } from "~/components/ui/progress";

interface AllocationProgressBarProps {
  totalAllocated: number;
  assetCount: number;
}

export function AllocationProgressBar({ totalAllocated, assetCount }: AllocationProgressBarProps) {
  const isComplete = Math.abs(totalAllocated - 100) < 0.01;
  const isOverAllocated = totalAllocated > 100;
  const isUnderAllocated = totalAllocated < 100 && totalAllocated > 0;

  const getStatusColor = () => {
    if (isComplete) return "text-green-600";
    if (isOverAllocated) return "text-red-600";
    if (isUnderAllocated) return "text-yellow-600";
    return "text-gray-600";
  };

  const getStatusIcon = () => {
    if (isComplete) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (isOverAllocated) return <AlertCircle className="h-5 w-5 text-red-600" />;
    if (isUnderAllocated) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return null;
  };

  const getStatusMessage = () => {
    if (isComplete) return "Alocação completa e balanceada";
    if (isOverAllocated) return `Sobre-alocado em ${(totalAllocated - 100).toFixed(1)}%`;
    if (isUnderAllocated) return `Faltam ${(100 - totalAllocated).toFixed(1)}% para completar`;
    return "Adicione ativos para começar";
  };

  const getProgressColor = () => {
    if (isComplete) return "bg-success/100";
    if (isOverAllocated) return "bg-destructive/100";
    if (isUnderAllocated) return "bg-warning/100";
    return "bg-primary";
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <h4 className="font-semibold text-sm">Progresso da Alocação</h4>
            <p className={`text-xs ${getStatusColor()}`}>{getStatusMessage()}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getStatusColor()}`}>
            {totalAllocated.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {assetCount} {assetCount === 1 ? 'ativo' : 'ativos'}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Progress
          value={Math.min(totalAllocated, 100)}
          className={`h-3 ${isOverAllocated ? 'animate-pulse' : ''}`}
        />
        {isOverAllocated && (
          <Progress
            value={totalAllocated - 100}
            className="h-1 bg-destructive/20"
          />
        )}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span>50%</span>
        <span className="font-medium">100%</span>
      </div>
    </div>
  );
}
