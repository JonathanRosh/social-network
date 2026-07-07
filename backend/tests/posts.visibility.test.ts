// Integration-style test against real Postgres, same rationale as friends.test.ts.
// Requires the `postgres` service reachable (docker compose up -d postgres).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/db/prisma.js";
import { canViewPost, listUserPosts } from "../src/modules/posts/service.js";

async function createTestUser(username: string) {
  return prisma.user.create({
    data: { username, email: `${username}@test.local`, passwordHash: "test-hash", displayName: username },
  });
}

describe("post visibility resolution", () => {
  let owner: Awaited<ReturnType<typeof createTestUser>>;
  let friend: Awaited<ReturnType<typeof createTestUser>>;
  let stranger: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    owner = await createTestUser("test_vis_owner");
    friend = await createTestUser("test_vis_friend");
    stranger = await createTestUser("test_vis_stranger");

    const [userLowId, userHighId] = [owner.id, friend.id].sort();
    await prisma.friendship.create({
      data: { requesterId: owner.id, addresseeId: friend.id, status: "accepted", userLowId, userHighId },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, friend.id, stranger.id] } } });
    await prisma.$disconnect();
  });

  it("public posts are visible to owner, friends, and strangers", async () => {
    const post = await prisma.post.create({ data: { authorId: owner.id, content: "hi", visibility: "public" } });
    expect(await canViewPost(owner.id, post)).toBe(true);
    expect(await canViewPost(friend.id, post)).toBe(true);
    expect(await canViewPost(stranger.id, post)).toBe(true);
  });

  it("friends-only posts are visible to owner and friends, not strangers", async () => {
    const post = await prisma.post.create({
      data: { authorId: owner.id, content: "hi friends", visibility: "friends" },
    });
    expect(await canViewPost(owner.id, post)).toBe(true);
    expect(await canViewPost(friend.id, post)).toBe(true);
    expect(await canViewPost(stranger.id, post)).toBe(false);
  });

  it("private posts are visible only to the owner", async () => {
    const post = await prisma.post.create({
      data: { authorId: owner.id, content: "just me", visibility: "private" },
    });
    expect(await canViewPost(owner.id, post)).toBe(true);
    expect(await canViewPost(friend.id, post)).toBe(false);
    expect(await canViewPost(stranger.id, post)).toBe(false);
  });

  it("listUserPosts filters the full set correctly per viewer", async () => {
    // By this point owner has one post of each visibility (public/friends/private).
    const ownerPosts = await listUserPosts(owner.username, owner.id);
    const friendPosts = await listUserPosts(owner.username, friend.id);
    const strangerPosts = await listUserPosts(owner.username, stranger.id);

    expect(ownerPosts).toHaveLength(3);
    expect(friendPosts).toHaveLength(2);
    expect(strangerPosts).toHaveLength(1);
  });
});
