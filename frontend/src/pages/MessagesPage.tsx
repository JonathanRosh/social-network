import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as messagesApi from "../api/messages.js";

export function MessagesPage() {
  const query = useQuery({ queryKey: ["conversations"], queryFn: messagesApi.listConversations });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Messages</h1>
      <div className="space-y-2">
        {query.data?.conversations.length ? (
          query.data.conversations.map((c) => (
            <Link
              key={c.id}
              to={`/messages/${c.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{c.otherParticipant.displayName}</span>
                {c.lastMessage && (
                  <span className="text-xs text-gray-400">{new Date(c.lastMessage.createdAt).toLocaleString()}</span>
                )}
              </div>
              {c.lastMessage && <p className="mt-1 truncate text-sm text-gray-500">{c.lastMessage.content}</p>}
            </Link>
          ))
        ) : (
          <p className="text-sm text-gray-500">
            {query.isLoading ? "Loading…" : "No conversations yet. Message a friend from their profile to start one."}
          </p>
        )}
      </div>
    </div>
  );
}
