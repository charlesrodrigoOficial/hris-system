"use client";

import { addComment } from "@/lib/actions/feed.actions";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CommentForm({ postId }: { postId: string }) {
  const [state, action] = useActionState(addComment, {
    success: false,
    message: "",
  });

  return (
    <div className="space-y-2">
      <form action={action} className="flex gap-2">
        <input type="hidden" name="postId" value={postId} />
        <Input name="content" placeholder="Write a comment..." />
        <Button type="submit">Send</Button>
      </form>
      {!!state.message && (
        <p
          className={`text-sm ${state.success ? "text-green-600" : "text-destructive"}`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
