"use server";

import { prisma } from "./prisma";

interface Message {
  role: string;
  content: string;
}

export type ChatWithMessages = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

export async function saveChat({
  id,
  messages,
  userId,
  title,
}: {
  id: string;
  messages: Message[];
  userId: string;
  title?: string;
}) {
  const existingChat = await prisma.chat.findUnique({
    where: { id },
  });

  if (existingChat) {
    return await prisma.chat.update({
      where: { id },
      data: {
        messages: JSON.stringify(messages),
        updatedAt: new Date(),
      },
    });
  }

  const chatTitle = title || generateTitleFromMessages(messages);

  return await prisma.chat.create({
    data: {
      id,
      userId,
      title: chatTitle,
      messages: JSON.stringify(messages),
    },
  });
}

export async function getChatById({ id }: { id: string }) {
  const chat = await prisma.chat.findUnique({
    where: { id },
  });

  if (!chat) return null;

  return {
    ...chat,
    messages: JSON.parse(chat.messages as string) as Message[],
  } as ChatWithMessages;
}

export async function getChatsByUserId({ id }: { id: string }) {
  const chats = await prisma.chat.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return chats;
}

export async function deleteChatById({ id }: { id: string }) {
  return await prisma.chat.delete({
    where: { id },
  });
}

export async function updateChatTitle({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return await prisma.chat.update({
    where: { id },
    data: { title },
  });
}

function generateTitleFromMessages(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage || !firstUserMessage.content) {
    return "Nova conversa";
  }

  const content = firstUserMessage.content;
  return content.length > 50 ? content.slice(0, 50) + "..." : content;
}
