import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as friendsApi from "../api/friends.js";

export function FriendsPage() {
  const queryClient = useQueryClient();

  const friendsQuery = useQuery({ queryKey: ["friends"], queryFn: friendsApi.listFriends });
  const requestsQuery = useQuery({ queryKey: ["friendRequests"], queryFn: friendsApi.listFriendRequests });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  }

  const acceptMutation = useMutation({ mutationFn: friendsApi.acceptFriendRequest, onSuccess: invalidate });
  const declineMutation = useMutation({ mutationFn: friendsApi.declineFriendRequest, onSuccess: invalidate });
  const cancelMutation = useMutation({ mutationFn: friendsApi.cancelFriendRequest, onSuccess: invalidate });
  const removeMutation = useMutation({ mutationFn: friendsApi.removeFriend, onSuccess: invalidate });

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Incoming requests</h2>
        {requestsQuery.data?.incoming.length ? (
          <ul className="space-y-3">
            {requestsQuery.data.incoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between">
                <Link to={`/profile/${r.from.username}`} className="text-sm font-medium text-gray-900 hover:underline">
                  {r.from.displayName} <span className="text-gray-500">@{r.from.username}</span>
                </Link>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => acceptMutation.mutate(r.id)}
                    className="rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => declineMutation.mutate(r.id)}
                    className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            {requestsQuery.isLoading ? "Loading…" : "No incoming requests."}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Sent requests</h2>
        {requestsQuery.data?.outgoing.length ? (
          <ul className="space-y-3">
            {requestsQuery.data.outgoing.map((r) => (
              <li key={r.id} className="flex items-center justify-between">
                <Link to={`/profile/${r.to.username}`} className="text-sm font-medium text-gray-900 hover:underline">
                  {r.to.displayName} <span className="text-gray-500">@{r.to.username}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => cancelMutation.mutate(r.id)}
                  className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            {requestsQuery.isLoading ? "Loading…" : "No sent requests."}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Friends</h2>
        {friendsQuery.data?.friends.length ? (
          <ul className="space-y-3">
            {friendsQuery.data.friends.map((f) => (
              <li key={f.id} className="flex items-center justify-between">
                <Link to={`/profile/${f.username}`} className="text-sm font-medium text-gray-900 hover:underline">
                  {f.displayName} <span className="text-gray-500">@{f.username}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => removeMutation.mutate(f.id)}
                  className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            {friendsQuery.isLoading ? "Loading…" : "No friends yet."}
          </p>
        )}
      </section>
    </div>
  );
}
