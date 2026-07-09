// Integration-style test against real Postgres, same rationale as friends.test.ts.
// Covers the "only the author may edit/delete" rule for both posts and
// comments, the assignment's explicit authorization requirement.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/db/prisma.js";
import { updatePost, deletePost } from "../src/modules/posts/service.js";
import { updateComment, deleteComment, createComment } from "../src/modules/comments/service.js";
import { HttpError } from "../src/utils/errors.js";

async function createTestUser(username: string) {
  return prisma.user.create({
    data: { username, email: `${username}@test.local`, passwordHash: "test-hash", displayName: username },
  });
}

describe("ownership enforcement", () => {
  let owner: Awaited<ReturnType<typeof createTestUser>>;
  let stranger: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    owner = await createTestUser("test_own_owner");
    stranger = await createTestUser("test_own_stranger");
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, stranger.id] } } });
    await prisma.$disconnect();
  });

  it("only the author can edit or delete their post", async () => {
    const post = await prisma.post.create({
      data: { authorId: owner.id, content: "original", visibility: "public" },
    });

    await expect(updatePost(post.id, stranger.id, { content: "hacked" })).rejects.toThrow(HttpError);
    await expect(deletePost(post.id, stranger.id)).rejects.toThrow(HttpError);

    const updated = await updatePost(post.id, owner.id, { content: "edited by owner" });
    expect(updated.content).toBe("edited by owner");

    await deletePost(post.id, owner.id);
    expect(await prisma.post.findUnique({ where: { id: post.id } })).toBeNull();
  });

  it("only the author can edit or delete their comment", async () => {
    const post = await prisma.post.create({
      data: { authorId: owner.id, content: "commentable", visibility: "public" },
    });
    const comment = await createComment(post.id, stranger.id, "a comment");

    await expect(updateComment(comment.id, owner.id, "hacked")).rejects.toThrow(HttpError);
    await expect(deleteComment(comment.id, owner.id)).rejects.toThrow(HttpError);

    const updated = await updateComment(comment.id, stranger.id, "edited by author");
    expect(updated.content).toBe("edited by author");

    await deleteComment(comment.id, stranger.id);
    expect(await prisma.comment.findUnique({ where: { id: comment.id } })).toBeNull();

    await prisma.post.delete({ where: { id: post.id } });
  });
});
