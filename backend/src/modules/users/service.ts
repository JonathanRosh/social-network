import type { User } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { getRelationshipStatus } from "../friends/service.js";

/** Shape returned for someone else's profile. Never includes email. */
export function toPublicProfile(user: User) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

export async function getPublicProfile(username: string, viewerId: string) {
  const user = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });
  if (!user) return null;
  const relationship = await getRelationshipStatus(viewerId, user.id);
  return {
    ...toPublicProfile(user),
    relationship: relationship.status,
    friendshipId: relationship.friendshipId,
  };
}

export async function updateProfile(
  userId: string,
  data: { displayName?: string; bio?: string | null; avatarUrl?: string | null },
): Promise<User> {
  return prisma.user.update({ where: { id: userId }, data });
}
