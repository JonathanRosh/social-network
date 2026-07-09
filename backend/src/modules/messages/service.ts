import { Prisma, type Conversation } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { HttpError } from "../../utils/errors.js";
import { areFriends } from "../friends/service.js";

function normalizedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

const participantSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

const messageSenderSelect = participantSelect;

export interface MessageCursor {
  createdAt: Date;
  id: string;
}

/** Messaging is friends-only, re-checked here and again on every send in
 * case the friendship ends after the conversation already exists. */
export async function getOrCreateConversation(userId: string, friendId: string): Promise<Conversation> {
  if (userId === friendId) {
    throw new HttpError(400, "You can't start a conversation with yourself");
  }
  if (!(await areFriends(userId, friendId))) {
    throw new HttpError(403, "You can only message friends");
  }

  const [userLowId, userHighId] = normalizedPair(userId, friendId);

  const existing = await prisma.conversation.findUnique({ where: { userLowId_userHighId: { userLowId, userHighId } } });
  if (existing) return existing;

  try {
    return await prisma.conversation.create({ data: { userLowId, userHighId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Two concurrent "start conversation" calls raced; the unique index caught it.
      const conversation = await prisma.conversation.findUnique({
        where: { userLowId_userHighId: { userLowId, userHighId } },
      });
      if (conversation) return conversation;
    }
    throw err;
  }
}

export async function getConversationOrThrow(conversationId: string, viewerId: string): Promise<Conversation> {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  // 404, not 403, whether the conversation doesn't exist or the viewer isn't a
  // participant. Same rationale as posts: don't confirm it exists at all.
  if (!conversation || (conversation.userLowId !== viewerId && conversation.userHighId !== viewerId)) {
    throw new HttpError(404, "Conversation not found");
  }
  return conversation;
}

function otherParticipantId(conversation: Conversation, viewerId: string): string {
  return conversation.userLowId === viewerId ? conversation.userHighId : conversation.userLowId;
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const conversation = await getConversationOrThrow(conversationId, senderId);
  const otherId = otherParticipantId(conversation, senderId);

  if (!(await areFriends(senderId, otherId))) {
    throw new HttpError(403, "You can only message friends");
  }

  return prisma.message.create({
    data: { conversationId, senderId, content },
    include: { sender: { select: messageSenderSelect } },
  });
}

export async function listMessages(
  conversationId: string,
  viewerId: string,
  cursor: MessageCursor | null,
  limit: number,
) {
  await getConversationOrThrow(conversationId, viewerId);

  // Oldest first, same cursor shape as comments: "after this point", so `>` not `<`.
  const cursorWhere: Prisma.MessageWhereInput | undefined = cursor
    ? {
        OR: [
          { createdAt: { gt: cursor.createdAt } },
          { createdAt: cursor.createdAt, id: { gt: cursor.id } },
        ],
      }
    : undefined;

  const rows = await prisma.message.findMany({
    where: cursorWhere ? { conversationId, ...cursorWhere } : { conversationId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    include: { sender: { select: messageSenderSelect } },
  });

  const hasMore = rows.length > limit;
  const messages = hasMore ? rows.slice(0, limit) : rows;
  const last = messages[messages.length - 1];
  const nextCursor: MessageCursor | null = hasMore && last ? { createdAt: last.createdAt, id: last.id } : null;

  return { messages, nextCursor };
}

export async function listConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userLowId: userId }, { userHighId: userId }] },
    include: {
      userLow: { select: participantSelect },
      userHigh: { select: participantSelect },
      messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { id: true } } } },
    },
  });

  const shaped = conversations.map((c) => {
    const otherParticipant = c.userLowId === userId ? c.userHigh : c.userLow;
    const lastMessage = c.messages[0] ?? null;
    return {
      id: c.id,
      otherParticipant,
      lastMessage: lastMessage
        ? { content: lastMessage.content, createdAt: lastMessage.createdAt, senderId: lastMessage.senderId }
        : null,
      createdAt: c.createdAt,
    };
  });

  // Most recently active first, falling back to createdAt if there's no message yet.
  // Sorted in application code: Prisma has no "order by latest related row" clause
  // short of raw SQL, and this list is never large enough for it to matter.
  shaped.sort((a, b) => {
    const aTime = (a.lastMessage?.createdAt ?? a.createdAt).getTime();
    const bTime = (b.lastMessage?.createdAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });

  return shaped;
}
