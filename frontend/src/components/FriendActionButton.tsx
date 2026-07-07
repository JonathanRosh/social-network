import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as friendsApi from "../api/friends.js";
import type { PublicProfile } from "../api/types.js";

const buttonClass = "rounded-md px-3 py-1.5 text-sm font-medium";
const primaryClass = `${buttonClass} bg-gray-900 text-white hover:bg-gray-700`;
const secondaryClass = `${buttonClass} border border-gray-300 text-gray-700 hover:bg-gray-50`;

export function FriendActionButton({ profile }: { profile: PublicProfile }) {
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["profile", profile.username] });
    queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    queryClient.invalidateQueries({ queryKey: ["friends"] });
  }

  const sendMutation = useMutation({
    mutationFn: () => friendsApi.sendFriendRequest(profile.id),
    onSuccess: invalidate,
  });
  const cancelMutation = useMutation({
    mutationFn: () => friendsApi.cancelFriendRequest(profile.friendshipId!),
    onSuccess: invalidate,
  });
  const acceptMutation = useMutation({
    mutationFn: () => friendsApi.acceptFriendRequest(profile.friendshipId!),
    onSuccess: invalidate,
  });
  const declineMutation = useMutation({
    mutationFn: () => friendsApi.declineFriendRequest(profile.friendshipId!),
    onSuccess: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: () => friendsApi.removeFriend(profile.id),
    onSuccess: invalidate,
  });

  if (profile.relationship === "self") return null;

  if (profile.relationship === "none") {
    return (
      <button type="button" className={primaryClass} disabled={sendMutation.isPending} onClick={() => sendMutation.mutate()}>
        {sendMutation.isPending ? "Sending…" : "Add friend"}
      </button>
    );
  }

  if (profile.relationship === "pending_outgoing") {
    return (
      <button type="button" className={secondaryClass} disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
        {cancelMutation.isPending ? "Cancelling…" : "Cancel request"}
      </button>
    );
  }

  if (profile.relationship === "pending_incoming") {
    return (
      <div className="flex gap-2">
        <button type="button" className={primaryClass} disabled={acceptMutation.isPending} onClick={() => acceptMutation.mutate()}>
          Accept
        </button>
        <button type="button" className={secondaryClass} disabled={declineMutation.isPending} onClick={() => declineMutation.mutate()}>
          Decline
        </button>
      </div>
    );
  }

  // relationship === "friends"
  return (
    <button type="button" className={secondaryClass} disabled={removeMutation.isPending} onClick={() => removeMutation.mutate()}>
      {removeMutation.isPending ? "Removing…" : "Remove friend"}
    </button>
  );
}
