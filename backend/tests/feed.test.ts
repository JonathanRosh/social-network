// Integration-style test against real Postgres, same rationale as friends.test.ts.
// Locks in feed *composition* (whose posts appear) as distinct from post
// *visibility* (who's allowed to view a post directly) — a stranger's public
// post is viewable on their profile but must never appear in someone else's
// feed just because it's public.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/db/prisma.js";
import { getFeed } from "../src/modules/feed/service.js";

async function createTestUser(username: string) {
  return prisma.user.create({
    data: { username, email: `${username}@test.local`, passwordHash: "test-hash", displayName: username },
  });
}

describe("feed composition", () => {
  let viewer: Awaited<ReturnType<typeof createTestUser>>;
  let friend: Awaited<ReturnType<typeof createTestUser>>;
  let stranger: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    viewer = await createTestUser("test_feed_viewer");
    friend = await createTestUser("test_feed_friend");
    stranger = await createTestUser("test_feed_stranger");

    const [userLowId, userHighId] = [viewer.id, friend.id].sort();
    await prisma.friendship.create({
      data: { requesterId: viewer.id, addresseeId: friend.id, status: "accepted", userLowId, userHighId },
    });

    await prisma.post.create({ data: { authorId: viewer.id, content: "my own post", visibility: "private" } });
    await prisma.post.create({ data: { authorId: friend.id, content: "friend public", visibility: "public" } });
    await prisma.post.create({ data: { authorId: friend.id, content: "friend friends-only", visibility: "friends" } });
    await prisma.post.create({ data: { authorId: friend.id, content: "friend private", visibility: "private" } });
    await prisma.post.create({ data: { authorId: stranger.id, content: "stranger public", visibility: "public" } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [viewer.id, friend.id, stranger.id] } } });
    await prisma.$disconnect();
  });

  it("includes own posts and friends' public/friends-only posts, excludes a stranger's public post and a friend's private post", async () => {
    const { posts } = await getFeed(viewer.id, null, 20);
    const contents = posts.map((p) => p.content);

    expect(contents).toContain("my own post");
    expect(contents).toContain("friend public");
    expect(contents).toContain("friend friends-only");
    expect(contents).not.toContain("friend private");
    expect(contents).not.toContain("stranger public");
  });
});
