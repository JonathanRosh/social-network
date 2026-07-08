import { z } from "zod";

export const startConversationSchema = z.object({
  friendId: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});

export const listMessagesQuerySchema = z
  .object({
    cursorCreatedAt: z.string().datetime().optional(),
    cursorId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .refine((data) => Boolean(data.cursorCreatedAt) === Boolean(data.cursorId), {
    message: "cursorCreatedAt and cursorId must be provided together",
  });
