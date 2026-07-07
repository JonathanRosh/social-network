import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "../api/users.js";
import { FriendActionButton } from "../components/FriendActionButton.js";

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => getProfile(username!),
    enabled: !!username,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading…</div>;
  }

  if (error || !data) {
    return <div className="p-8 text-center text-gray-500">User not found.</div>;
  }

  const { user } = data;
  const isOwnProfile = user.relationship === "self";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{user.displayName}</h1>
            <p className="text-sm text-gray-500">@{user.username}</p>
          </div>
          {isOwnProfile ? (
            <Link
              to="/profile/me/edit"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit profile
            </Link>
          ) : (
            <FriendActionButton profile={user} />
          )}
        </div>
        {user.bio && <p className="mt-4 whitespace-pre-wrap text-gray-700">{user.bio}</p>}
        <p className="mt-4 text-xs text-gray-400">
          Joined {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
