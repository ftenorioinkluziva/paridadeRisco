import { useMemo } from "react";
import { cn } from "~/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    return score;
  }, [password]);
  
  const getStrengthLabel = () => {
    if (strength === 0) return "";
    if (strength <= 2) return "Fraca";
    if (strength <= 4) return "Média";
    return "Forte";
  };
  
  const getStrengthColor = () => {
    if (strength === 0) return "bg-gray-200";
    if (strength <= 2) return "bg-red-500";
    if (strength <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  if (!password) return null;
  
  return (
    <div className={cn("mt-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Força da senha:</span>
        <span className={cn(
          "font-medium",
          strength <= 2 ? "text-red-600" : 
          strength <= 4 ? "text-yellow-600" : 
          "text-green-600"
        )}>
          {getStrengthLabel()}
        </span>
      </div>
      <div className="mt-1 flex space-x-1">
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <div
            key={level}
            className={cn(
              "h-2 flex-1 rounded-sm transition-colors",
              level <= strength ? getStrengthColor() : "bg-gray-200"
            )}
          />
        ))}
      </div>
      {strength > 0 && strength < 4 && (
        <div className="mt-2 text-xs text-gray-600">
          <p>Para uma senha mais forte, inclua:</p>
          <ul className="ml-2 list-disc space-y-1">
            {password.length < 8 && <li>Pelo menos 8 caracteres</li>}
            {!/[a-z]/.test(password) && <li>Letras minúsculas</li>}
            {!/[A-Z]/.test(password) && <li>Letras maiúsculas</li>}
            {!/[0-9]/.test(password) && <li>Números</li>}
            {!/[^A-Za-z0-9]/.test(password) && <li>Símbolos especiais</li>}
          </ul>
        </div>
      )}
    </div>
  );
}