"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Chat } from "~/components/chat/chat";
import { Skeleton } from "~/components/ui/skeleton";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatIdPage() {
  const params = useParams();
  const chatId = params.id as string;

  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(`/api/chat/${chatId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setInitialMessages(data.messages || []);
        }
        // Se 404, apenas usa array vazio (chat novo)
      } catch (error) {
        console.error("Failed to fetch chat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChat();
  }, [chatId]);

  if (isLoading) {
    return (
      <div className="h-full p-4">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      <Chat id={chatId} initialMessages={initialMessages} />
    </div>
  );
}
