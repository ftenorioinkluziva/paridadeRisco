"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";
import { MessageSquare, Loader2, Bot } from "lucide-react";
import { generateUUID } from "~/lib/utils";
import { ChatMessage } from "./message";
import { ChatInput } from "./chat-input";
import { Overview } from "./overview";
import { useScrollToBottom } from "./use-scroll-to-bottom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  id?: string;
  initialMessages?: Message[];
  onChatCreated?: (id: string) => void;
}

export function Chat({ id, initialMessages = [], onChatCreated }: ChatProps) {
  const router = useRouter();
  const [chatId] = useState(() => id || generateUUID());
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [containerRef, endRef] = useScrollToBottom<HTMLDivElement>();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    const userMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: content.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const token = localStorage.getItem("auth_token");
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: chatId,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = generateUUID();

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        console.log('[Chat Frontend] Received chunk:', chunk.substring(0, 100));
        console.log('[Chat Frontend] Total content length:', assistantContent.length);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantContent } : m
          )
        );
      }

      console.log('[Chat Frontend] Streaming completed. Final content length:', assistantContent.length);
      if (assistantContent.length === 0) {
        console.log('[Chat Frontend] ERROR: No content received from streaming!');
      }

      if (!id && messages.length === 0) {
        onChatCreated?.(chatId);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);
        console.error("[Chat Error]:", err);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [chatId, id, isLoading, messages, onChatCreated]);

  const handleSubmit = () => {
    sendMessage(input);
    setInput("");
  };

  const handleSelectQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Consultor de Investimentos</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-4 overflow-hidden p-4 pt-0">
        <ScrollArea className="flex-1 pr-4">
          <div ref={containerRef} className="space-y-4">
            {messages.length === 0 ? (
              <Overview onSelectQuestion={handleSelectQuestion} />
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    content={message.content}
                  />
                ))}

                {isLoading && messages[messages.length - 1]?.role === "user" && (
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

                {error && (
                  <div className="flex justify-center">
                    <Badge variant="destructive" className="text-xs">
                      Erro: {error.message}
                    </Badge>
                  </div>
                )}
              </>
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}
