import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "../api/users.js";
import { useAuth } from "../context/AuthContext.js";

export function EditProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: ({ user: updated }) => {
      queryClient.setQueryData(["me"], updated);
      queryClient.invalidateQueries({ queryKey: ["profile", updated.username] });
      navigate(`/profile/${updated.username}`);
    },
  });

  if (!user) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate({ displayName, bio: bio.trim() === "" ? null : bio });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">Edit profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="displayName">
              Display name
            </label>
            <input
              id="displayName"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="bio">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
          </div>
          {mutation.error && <p className="text-sm text-red-600">{mutation.error.message}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {mutation.isPending ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/profile/${user.username}`)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
