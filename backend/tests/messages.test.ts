// Integration-style test against real Postgres, same rationale as friends.test.ts.
// Covers the bonus messaging feature's core authorization rules: friends-only,
// participant-only access, and re-checking friendship on every send (not just
// at conversation creation).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/db/prisma.js";
import * as messages from "../src/modules/messages/service.js";
import { HttpError } from "../src/utils/errors.js";

async function createTestUser(username: string) {
  return prisma.user.create({
    data: { username, email: `${username}@test.local`, passwordHash: "test-hash", displayName: username },
  });
}

async function makeFriends(aId: string, bId: string) {
  const [userLowId, userHighId] = [aId, bId].sort();
  await prisma.friendship.create({
    data: { requesterId: aId, addresseeId: bId, status: "accepted", userLowId, userHighId },
  });
}

describe("messaging", () => {
  let alice: Awaited<ReturnType<typeof createTestUser>>;
  let bob: Awaited<ReturnType<typeof createTestUser>>;
  let carol: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    alice = await createTestUser("test_msg_alice");
    bob = await createTestUser("test_msg_bob");
    carol = await createTestUser("test_msg_carol");
    await makeFriends(alice.id, bob.id);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [alice.id, bob.id, carol.id] } } });
    await prisma.$disconnect();
  });

  it("rejects starting a conversation with a non-friend", async () => {
    await expect(messages.getOrCreateConversation(alice.id, carol.id)).rejects.toThrow(HttpError);
  });

  it("creates a conversation between friends, idempotently regardless of direction", async () => {
    const first = await messages.getOrCreateConversation(alice.id, bob.id);
    const second = await messages.getOrCreateConversation(bob.id, alice.id);
    expect(second.id).toBe(first.id);
  });

  it("lets participants send and read messages, in chronological order", async () => {
    const conversation = await messages.getOrCreateConversation(alice.id, bob.id);
    await messages.sendMessage(conversation.id, alice.id, "hey bob");
    await messages.sendMessage(conversation.id, bob.id, "hey alice");

    const { messages: history } = await messages.listMessages(conversation.id, alice.id, null, 20);
    expect(history.map((m) => m.content)).toEqual(["hey bob", "hey alice"]);
  });

  it("rejects a non-participant from reading or sending", async () => {
    const conversation = await messages.getOrCreateConversation(alice.id, bob.id);
    await expect(messages.listMessages(conversation.id, carol.id, null, 20)).rejects.toThrow(HttpError);
    await expect(messages.sendMessage(conversation.id, carol.id, "sneaky")).rejects.toThrow(HttpError);
  });

  it("blocks sending once the friendship ends, even in an existing conversation", async () => {
    const conversation = await messages.getOrCreateConversation(alice.id, bob.id);
    await prisma.friendship.deleteMany({ where: { userLowId: [alice.id, bob.id].sort()[0], userHighId: [alice.id, bob.id].sort()[1] } });

    await expect(messages.sendMessage(conversation.id, alice.id, "still friends?")).rejects.toThrow(HttpError);

    // restore for other tests / afterAll cleanup consistency
    await makeFriends(alice.id, bob.id);
  });
});
