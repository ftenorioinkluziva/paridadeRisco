"use client";

import { Bot, TrendingUp } from "lucide-react";
import { Button } from "~/components/ui/button";

const SUGGESTED_QUESTIONS = [
  "Qual é o meu Risk Balance Score atual?",
  "Como está a performance do meu portfólio?",
  "Explique o conceito de Paridade de Risco",
  "Devo rebalancear minha carteira agora?",
  "Quais são os principais riscos do meu portfólio?",
];

interface OverviewProps {
  onSelectQuestion: (question: string) => void;
}

export function Overview({ onSelectQuestion }: OverviewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Bot className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
      <h3 className="font-semibold text-lg mb-2">Como posso ajudar?</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        Sou especialista em Paridade de Risco e análise de portfólio. Pergunte
        sobre seu portfólio, estratégias ou conceitos de investimento.
      </p>

      <div className="space-y-2 w-full max-w-md">
        <p className="text-xs text-muted-foreground mb-3">
          Perguntas sugeridas:
        </p>
        {SUGGESTED_QUESTIONS.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 px-4"
            onClick={() => onSelectQuestion(question)}
          >
            <TrendingUp className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="text-sm">{question}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
