"use client";

import { useRouter } from "next/navigation";
import { Chat } from "~/components/chat/chat";

export default function ChatPage() {
  const router = useRouter();

  const handleChatCreated = (id: string) => {
    router.replace(`/chat/${id}`);
  };

  return (
    <div className="h-full p-4">
      <Chat onChatCreated={handleChatCreated} />
    </div>
  );
}
