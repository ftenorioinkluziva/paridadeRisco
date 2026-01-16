"use client";

import { useEffect, useState } from "react";
import { ChatSidebar } from "~/components/chat/chat-sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]!));
        setUserId(payload.userId);
      } catch {
        console.error("Failed to decode token");
      }
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {userId && (
        <div className="w-64 flex-shrink-0 hidden md:block">
          <ChatSidebar userId={userId} />
        </div>
      )}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
