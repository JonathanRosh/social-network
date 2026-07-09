import type { QueryClient } from "@tanstack/react-query";
import type { Message, MessagesPage } from "../api/types.js";

/** Same dedupe-by-id-then-resort merge as commentsCache.ts. Used by both the
 * socket handler and the send mutation's own success, so they converge safely. */
export function upsertMessage(queryClient: QueryClient, conversationId: string, message: Message) {
  queryClient.setQueryData<MessagesPage>(["messages", conversationId], (old) => {
    if (!old) return old;
    const byId = new Map(old.messages.map((m) => [m.id, m]));
    byId.set(message.id, message);
    const messages = Array.from(byId.values()).sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
    return { ...old, messages };
  });
}
