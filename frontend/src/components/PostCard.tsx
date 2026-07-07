import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as postsApi from "../api/posts.js";
import type { Post, PostVisibility } from "../api/types.js";

const visibilityLabel: Record<PostVisibility, string> = {
  public: "Public",
  friends: "Friends only",
  private: "Private",
};

interface PostCardProps {
  post: Post;
  isOwn: boolean;
  /** Username this post belongs to — used to invalidate that profile's post list. */
  authorUsername: string;
  /** When provided, renders an author header linking to their profile (feed context). */
  authorDisplayName?: string;
}

export function PostCard({ post, isOwn, authorUsername, authorDisplayName }: PostCardProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(post.content);
  const [visibility, setVisibility] = useState<PostVisibility>(post.visibility);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["posts", authorUsername] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  }

  const updateMutation = useMutation({
    mutationFn: () => postsApi.updatePost(post.id, { content, visibility }),
    onSuccess: () => {
      invalidate();
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => postsApi.deletePost(post.id),
    onSuccess: invalidate,
  });

  if (isEditing) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={5000}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as PostVisibility)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="public">Public</option>
            <option value="friends">Friends only</option>
            <option value="private">Private</option>
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {authorDisplayName && (
        <Link to={`/profile/${authorUsername}`} className="mb-2 block text-sm font-medium text-gray-900 hover:underline">
          {authorDisplayName} <span className="font-normal text-gray-500">@{authorUsername}</span>
        </Link>
      )}
      <div className="flex items-start justify-between">
        <p className="whitespace-pre-wrap text-sm text-gray-900">{post.content}</p>
        {isOwn && (
          <div className="ml-4 flex shrink-0 gap-2">
            <button type="button" onClick={() => setIsEditing(true)} className="text-xs text-gray-500 hover:text-gray-900">
              Edit
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="text-xs text-gray-500 hover:text-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
        <span>{visibilityLabel[post.visibility]}</span>
        <span>·</span>
        <span>{new Date(post.createdAt).toLocaleString()}</span>
      </div>
    </div>
  );
}
