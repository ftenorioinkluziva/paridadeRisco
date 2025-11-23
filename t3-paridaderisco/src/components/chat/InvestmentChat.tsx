"use client";

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";
import { MessageSquare, Send, Loader2, Bot, User, TrendingUp } from "lucide-react";
import { cn } from "~/lib/utils";

const SUGGESTED_QUESTIONS = [
  "Qual é o meu Risk Balance Score atual?",
  "Como está a performance do meu portfólio?",
  "Explique o conceito de Paridade de Risco",
  "Devo rebalancear minha carteira agora?",
  "Quais são os principais riscos do meu portfólio?",
];

export function InvestmentChat() {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  const { messages, status, error, sendMessage } = useChat({
    api: '/api/chat',
    maxSteps: 5, // Permitir múltiplos steps para tool calls
    onError: (error) => {
      console.error('[Chat Error]:', error);
    },
    onFinish: (message) => {
      console.log('[Frontend] Finished message:', message);
      console.log('[Frontend] Total messages:', messages.length);
    },
  });

  const isLoading = status === 'in_progress';

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue(''); // Limpa antes de enviar

    // sendMessage aceita um objeto UIMessage
    sendMessage({
      role: 'user',
      content: message,
    } as any);
  };

  const handleSuggestedQuestion = (question: string) => {
    setSelectedQuestion(question);
    sendMessage({
      role: 'user',
      content: question,
    } as any);
  };

  return (
    <Card className="flex flex-col h-[700px]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Consultor de Investimentos</CardTitle>
            <CardDescription>
              Tire dúvidas sobre seu portfólio e estratégias de investimento
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-4 overflow-hidden">
        {/* Área de mensagens */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bot className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-semibold text-lg mb-2">Como posso ajudar?</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  Sou especialista em Paridade de Risco e análise de portfólio.
                  Pergunte sobre seu portfólio, estratégias ou conceitos de investimento.
                </p>

                {/* Perguntas sugeridas */}
                <div className="space-y-2 w-full max-w-md">
                  <p className="text-xs text-muted-foreground mb-3">Perguntas sugeridas:</p>
                  {SUGGESTED_QUESTIONS.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 px-4"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{question}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 items-start",
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  {/* Mensagem */}
                  <div
                    className={cn(
                      "flex-1 rounded-lg p-4 max-w-[80%]",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content || (message as any).parts?.find((p: any) => p.type === 'text')?.text || ''}
                    </div>

                    {/* Tool calls (se houver) */}
                    {message.toolInvocations && message.toolInvocations.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.toolInvocations.map((tool: any, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            🔧 {tool.toolName}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1 rounded-lg p-4 bg-muted max-w-[80%]">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analisando...
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex justify-center">
                <Badge variant="destructive" className="text-xs">
                  Erro: {error.message}
                </Badge>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input de mensagem */}
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <Input
            name="message"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite sua pergunta sobre investimentos..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
