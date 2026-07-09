import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as messagesApi from "../api/messages.js";
import { getProfile } from "../api/users.js";
import { useAuth } from "../context/AuthContext.js";
import { useSocket } from "../context/SocketContext.js";
import { upsertMessage } from "../utils/messagesCache.js";
import type { Message } from "../api/types.js";

export function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = useQuery({ queryKey: ["conversations"], queryFn: messagesApi.listConversations });
  const conversation = conversationsQuery.data?.conversations.find((c) => c.id === conversationId);

  const messagesQuery = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messagesApi.listMessages(conversationId!),
    enabled: !!conversationId,
  });

  // Proactively checked (not just reactively on a failed send) so the
  // composer is clearly disabled the moment the thread loads, rather than
  // only after the user tries to send and gets a rejection.
  const otherUsername = conversation?.otherParticipant.username;
  const otherProfileQuery = useQuery({
    queryKey: ["profile", otherUsername],
    queryFn: () => getProfile(otherUsername!),
    enabled: !!otherUsername,
  });
  const isFriends = otherProfileQuery.data?.user.relationship === "friends";

  // Join the conversation's room only while this thread is open. The server
  // re-checks participant membership on every join (same pattern as post
  // comment rooms), so this can't be used to peek at someone else's DMs.
  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit("conversation:join", conversationId);

    function onCreated(message: Message) {
      if (message.conversationId === conversationId) upsertMessage(queryClient, conversationId, message);
    }
    socket.on("message:created", onCreated);

    return () => {
      socket.emit("conversation:leave", conversationId);
      socket.off("message:created", onCreated);
    };
  }, [socket, conversationId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messagesQuery.data?.messages.length]);

  const sendMutation = useMutation({
    mutationFn: () => messagesApi.sendMessage(conversationId!, content),
    onSuccess: ({ message }) => {
      upsertMessage(queryClient, conversationId!, message);
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => {
      // The friendship may have just ended in a way we hadn't refetched yet.
      // Refresh the profile so the "you need to be friends" banner appears
      // immediately instead of only on the next successful poll.
      queryClient.invalidateQueries({ queryKey: ["profile", otherUsername] });
    },
  });

  if (!user || !conversationId) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (content.trim() && isFriends) sendMutation.mutate();
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-4rem)] max-w-2xl flex-col px-4 py-8">
      <div className="mb-4 flex items-center gap-3 border-b border-gray-200 pb-4">
        <Link to="/messages" className="text-sm text-gray-500 hover:text-gray-900">
          ← Messages
        </Link>
        {conversation && (
          <Link
            to={`/profile/${conversation.otherParticipant.username}`}
            className="font-semibold text-gray-900 hover:underline"
          >
            {conversation.otherParticipant.displayName}
          </Link>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {messagesQuery.data?.messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === user.id ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                m.senderId === user.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {conversation && otherProfileQuery.data && !isFriends ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-800">
          In order to send a message, you need to be friends with {conversation.otherParticipant.displayName}.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2 border-t border-gray-200 pt-4">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a message…"
            maxLength={4000}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sendMutation.isPending || !content.trim()}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
