import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as commentsApi from "../api/comments.js";
import type { Comment } from "../api/types.js";
import { upsertComment, removeComment } from "../utils/commentsCache.js";

export function CommentItem({ comment, isOwn }: { comment: Comment; isOwn: boolean }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content);

  const updateMutation = useMutation({
    mutationFn: () => commentsApi.updateComment(comment.id, content),
    onSuccess: ({ comment: updated }) => {
      upsertComment(queryClient, comment.postId, updated);
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => commentsApi.deleteComment(comment.id),
    onSuccess: () => removeComment(queryClient, comment.postId, comment.id),
  });

  if (isEditing) {
    return (
      <div className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-gray-500 focus:outline-none"
        />
        <button type="button" onClick={() => updateMutation.mutate()} className="text-xs text-gray-900 hover:underline">
          Save
        </button>
        <button type="button" onClick={() => setIsEditing(false)} className="text-xs text-gray-500 hover:underline">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <p>
        <span className="font-medium text-gray-900">{comment.author.displayName}</span>{" "}
        <span className="text-gray-700">{comment.content}</span>
      </p>
      {isOwn && (
        <div className="flex shrink-0 gap-2">
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
  );
}
