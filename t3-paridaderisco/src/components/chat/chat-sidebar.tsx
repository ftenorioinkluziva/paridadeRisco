"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, History } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Skeleton } from "~/components/ui/skeleton";
import { HistoryItem } from "./history-item";

interface ChatHistory {
  id: string;
  title: string;
  createdAt: Date;
}

interface ChatSidebarProps {
  userId: string;
}

export function ChatSidebar({ userId }: ChatSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/chat/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [pathname]);

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`/api/chat?id=${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      setChats((prev) => prev.filter((chat) => chat.id !== id));
      if (pathname === `/chat/${id}`) {
        router.push("/chat");
      }
    }
  };

  const handleNewChat = () => {
    router.push("/chat");
  };

  const currentChatId = pathname.startsWith("/chat/")
    ? pathname.replace("/chat/", "")
    : null;

  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      <div className="p-4 border-b">
        <Button onClick={handleNewChat} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Nova conversa
        </Button>
      </div>

      <div className="flex items-center gap-2 px-4 py-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Histórico
        </span>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {isLoading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-3 py-2">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </>
          ) : chats.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nenhuma conversa ainda
            </p>
          ) : (
            chats.map((chat) => (
              <HistoryItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === currentChatId}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
