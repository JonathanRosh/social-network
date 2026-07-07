import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as postsApi from "../api/posts.js";
import type { PostVisibility } from "../api/types.js";

export function PostComposer({ username }: { username: string }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("friends");

  const mutation = useMutation({
    mutationFn: () => postsApi.createPost({ content, visibility }),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["posts", username] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
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
        <button
          type="submit"
          disabled={mutation.isPending || !content.trim()}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {mutation.isPending ? "Posting…" : "Post"}
        </button>
      </div>
      {mutation.error && <p className="mt-2 text-sm text-red-600">{mutation.error.message}</p>}
    </form>
  );
}
