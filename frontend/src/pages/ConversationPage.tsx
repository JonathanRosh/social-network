import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as messagesApi from "../api/messages.js";
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
  const messagesQuery = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messagesApi.listMessages(conversationId!),
    enabled: !!conversationId,
  });

  // Join the conversation's room only while this thread is open — the server
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
  });

  if (!user || !conversationId) return null;

  const conversation = conversationsQuery.data?.conversations.find((c) => c.id === conversationId);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (content.trim()) sendMutation.mutate();
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
    </div>
  );
}
