// Integration-style test: exercises the friendship state machine against a
// real Postgres instance (via DATABASE_URL / tests/setup.ts), since mocking
// Prisma's query builder accurately would obscure the actual behavior we
// care about here (the DB-level duplicate guarantee, ownership checks).
// Requires the `postgres` service to be reachable — e.g. `docker compose up -d postgres`.
// Tests run sequentially and share state within the describe block, mirroring
// the real request/accept/remove lifecycle rather than testing in isolation.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/db/prisma.js";
import * as friends from "../src/modules/friends/service.js";
import { HttpError } from "../src/utils/errors.js";

async function createTestUser(username: string) {
  return prisma.user.create({
    data: {
      username,
      email: `${username}@test.local`,
      passwordHash: "test-hash",
      displayName: username,
    },
  });
}

describe("friends service state machine", () => {
  let userA: Awaited<ReturnType<typeof createTestUser>>;
  let userB: Awaited<ReturnType<typeof createTestUser>>;
  let userC: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    userA = await createTestUser("test_friends_a");
    userB = await createTestUser("test_friends_b");
    userC = await createTestUser("test_friends_c");
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id, userC.id] } } });
    await prisma.$disconnect();
  });

  it("rejects sending a request to yourself", async () => {
    await expect(friends.sendFriendRequest(userA.id, userA.id)).rejects.toThrow(HttpError);
  });

  it("creates a pending request", async () => {
    const request = await friends.sendFriendRequest(userA.id, userB.id);
    expect(request.status).toBe("pending");
    expect(request.requesterId).toBe(userA.id);
    expect(request.addresseeId).toBe(userB.id);
  });

  it("rejects a duplicate request while one is pending, from either side", async () => {
    await expect(friends.sendFriendRequest(userA.id, userB.id)).rejects.toThrow(HttpError);
    await expect(friends.sendFriendRequest(userB.id, userA.id)).rejects.toThrow(HttpError);
  });

  it("only lets the addressee accept the request", async () => {
    const { incoming } = await friends.listPendingRequests(userB.id);
    const request = incoming.find((r) => r.requesterId === userA.id)!;

    await expect(friends.acceptFriendRequest(request.id, userA.id)).rejects.toThrow(HttpError);

    const accepted = await friends.acceptFriendRequest(request.id, userB.id);
    expect(accepted.status).toBe("accepted");
  });

  it("reports the pair as friends and rejects a new request between them", async () => {
    const status = await friends.getRelationshipStatus(userA.id, userB.id);
    expect(status.status).toBe("friends");

    await expect(friends.sendFriendRequest(userA.id, userB.id)).rejects.toThrow(HttpError);
  });

  it("removes the friendship and allows a fresh request afterward", async () => {
    await friends.removeFriend(userA.id, userB.id);

    const status = await friends.getRelationshipStatus(userA.id, userB.id);
    expect(status.status).toBe("none");

    const request = await friends.sendFriendRequest(userA.id, userB.id);
    expect(request.status).toBe("pending");
  });

  it("lets only the requester cancel a pending request", async () => {
    const { outgoing } = await friends.listPendingRequests(userA.id);
    const request = outgoing.find((r) => r.addresseeId === userB.id)!;

    await expect(friends.cancelFriendRequest(request.id, userB.id)).rejects.toThrow(HttpError);

    const cancelled = await friends.cancelFriendRequest(request.id, userA.id);
    expect(cancelled.status).toBe("cancelled");
  });

  it("allows a declined request to be re-sent later", async () => {
    const request = await friends.sendFriendRequest(userC.id, userA.id);
    const declined = await friends.declineFriendRequest(request.id, userA.id);
    expect(declined.status).toBe("declined");

    const retry = await friends.sendFriendRequest(userC.id, userA.id);
    expect(retry.status).toBe("pending");
  });
});
