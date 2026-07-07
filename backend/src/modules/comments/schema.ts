import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const listCommentsQuerySchema = z
  .object({
    cursorCreatedAt: z.string().datetime().optional(),
    cursorId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .refine((data) => Boolean(data.cursorCreatedAt) === Boolean(data.cursorId), {
    message: "cursorCreatedAt and cursorId must be provided together",
  });
