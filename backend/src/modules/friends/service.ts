import { Prisma, type Friendship } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { HttpError } from "../../utils/errors.js";

function normalizedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
  if (requesterId === addresseeId) {
    throw new HttpError(400, "You can't send a friend request to yourself");
  }

  const addressee = await prisma.user.findUnique({ where: { id: addresseeId } });
  if (!addressee) {
    throw new HttpError(404, "User not found");
  }

  const [userLowId, userHighId] = normalizedPair(requesterId, addresseeId);

  // Belt-and-suspenders: this check avoids a wasted round trip in the common
  // case, but the actual guarantee against duplicates is the DB's partial
  // unique index (friendships_active_pair_key) — see the catch block below.
  const existing = await prisma.friendship.findFirst({
    where: { userLowId, userHighId, status: { in: ["pending", "accepted"] } },
  });
  if (existing) {
    throw new HttpError(
      409,
      existing.status === "accepted" ? "You are already friends" : "A friend request already exists between you two",
    );
  }

  try {
    return await prisma.friendship.create({
      data: { requesterId, addresseeId, userLowId, userHighId, status: "pending" },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Two concurrent requests raced past the check above; the DB index caught it.
      throw new HttpError(409, "A friend request already exists between you two");
    }
    throw err;
  }
}

async function getPendingRequestOrThrow(requestId: string): Promise<Friendship> {
  const request = await prisma.friendship.findUnique({ where: { id: requestId } });
  if (!request) {
    throw new HttpError(404, "Friend request not found");
  }
  if (request.status !== "pending") {
    throw new HttpError(409, "This friend request is no longer pending");
  }
  return request;
}

export async function acceptFriendRequest(requestId: string, userId: string): Promise<Friendship> {
  const request = await getPendingRequestOrThrow(requestId);
  if (request.addresseeId !== userId) {
    throw new HttpError(403, "Only the recipient can accept this request");
  }
  return prisma.friendship.update({ where: { id: requestId }, data: { status: "accepted" } });
}

export async function declineFriendRequest(requestId: string, userId: string): Promise<Friendship> {
  const request = await getPendingRequestOrThrow(requestId);
  if (request.addresseeId !== userId) {
    throw new HttpError(403, "Only the recipient can decline this request");
  }
  return prisma.friendship.update({ where: { id: requestId }, data: { status: "declined" } });
}

export async function cancelFriendRequest(requestId: string, userId: string): Promise<Friendship> {
  const request = await getPendingRequestOrThrow(requestId);
  if (request.requesterId !== userId) {
    throw new HttpError(403, "Only the sender can cancel this request");
  }
  return prisma.friendship.update({ where: { id: requestId }, data: { status: "cancelled" } });
}

export async function removeFriend(userId: string, otherUserId: string): Promise<void> {
  const [userLowId, userHighId] = normalizedPair(userId, otherUserId);
  const friendship = await prisma.friendship.findFirst({
    where: { userLowId, userHighId, status: "accepted" },
  });
  if (!friendship) {
    throw new HttpError(404, "You are not friends with this user");
  }
  // Deleting (rather than marking a terminal status) fully severs the
  // relationship and frees the partial unique index, so a fresh request
  // can be sent later with no leftover history in the way.
  await prisma.friendship.delete({ where: { id: friendship.id } });
}

export async function listFriends(userId: string) {
  const rows = await prisma.friendship.findMany({
    where: { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    include: { requester: true, addressee: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((row) => (row.requesterId === userId ? row.addressee : row.requester));
}

export async function listPendingRequests(userId: string) {
  const [incoming, outgoing] = await Promise.all([
    prisma.friendship.findMany({
      where: { addresseeId: userId, status: "pending" },
      include: { requester: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: { requesterId: userId, status: "pending" },
      include: { addressee: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { incoming, outgoing };
}

export type RelationshipStatus = "self" | "friends" | "pending_outgoing" | "pending_incoming" | "none";

export async function getRelationshipStatus(
  viewerId: string,
  otherUserId: string,
): Promise<{ status: RelationshipStatus; friendshipId: string | null }> {
  if (viewerId === otherUserId) return { status: "self", friendshipId: null };

  const [userLowId, userHighId] = normalizedPair(viewerId, otherUserId);
  const friendship = await prisma.friendship.findFirst({
    where: { userLowId, userHighId, status: { in: ["pending", "accepted"] } },
  });

  if (!friendship) return { status: "none", friendshipId: null };
  if (friendship.status === "accepted") return { status: "friends", friendshipId: friendship.id };
  return {
    status: friendship.requesterId === viewerId ? "pending_outgoing" : "pending_incoming",
    friendshipId: friendship.id,
  };
}

/** Reused by later phases (feed visibility, comment gating, messaging gating). */
export async function getAcceptedFriendIds(userId: string): Promise<string[]> {
  const rows = await prisma.friendship.findMany({
    where: { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    select: { requesterId: true, addresseeId: true },
  });
  return rows.map((row) => (row.requesterId === userId ? row.addresseeId : row.requesterId));
}

export async function areFriends(userId: string, otherUserId: string): Promise<boolean> {
  const [userLowId, userHighId] = normalizedPair(userId, otherUserId);
  const friendship = await prisma.friendship.findFirst({
    where: { userLowId, userHighId, status: "accepted" },
  });
  return !!friendship;
}
