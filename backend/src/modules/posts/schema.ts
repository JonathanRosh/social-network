import { z } from "zod";

export const visibilitySchema = z.enum(["public", "friends", "private"]);

export const createPostSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  visibility: visibilitySchema.default("friends"),
});

export const updatePostSchema = z
  .object({
    content: z.string().trim().min(1).max(5000).optional(),
    visibility: visibilitySchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });
