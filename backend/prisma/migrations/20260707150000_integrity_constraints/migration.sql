-- Hand-written migration: constraints Prisma's schema DSL cannot express
-- (partial/filtered unique indexes, CHECK constraints). These are the actual
-- database-level guarantees behind the assignment's data-integrity requirements.
-- Purely additive — safe to apply on top of the init migration with no data loss.

-- A user can't send a friend request to themselves.
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_no_self_request_check" CHECK ("requester_id" <> "addressee_id");

-- The real "no duplicate/reverse-duplicate friendship" guarantee: only one
-- active (pending or accepted) row may exist per unordered pair of users.
-- A pair can still re-request after a prior row went to declined/cancelled,
-- since this index only applies to active statuses.
CREATE UNIQUE INDEX "friendships_active_pair_key" ON "friendships"("user_low_id", "user_high_id") WHERE "status" IN ('pending', 'accepted');

-- A conversation can't be with yourself.
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_no_self_check" CHECK ("user_low_id" <> "user_high_id");

-- Basic content-length sanity bounds at the DB layer, not just app validation.
ALTER TABLE "users" ADD CONSTRAINT "users_username_length_check" CHECK (length("username") BETWEEN 3 AND 30);
ALTER TABLE "posts" ADD CONSTRAINT "posts_content_length_check" CHECK (length("content") BETWEEN 1 AND 5000);
ALTER TABLE "comments" ADD CONSTRAINT "comments_content_length_check" CHECK (length("content") BETWEEN 1 AND 2000);
ALTER TABLE "messages" ADD CONSTRAINT "messages_content_length_check" CHECK (length("content") BETWEEN 1 AND 4000);
