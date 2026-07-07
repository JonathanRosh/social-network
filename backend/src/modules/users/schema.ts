import { z } from "zod";

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(50).optional(),
    bio: z.string().trim().max(500).nullable().optional(),
    avatarUrl: z.string().trim().url().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });
