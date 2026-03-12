"use client";

import { X } from "lucide-react";
import { useTransition } from "react";
import { deletePost } from "@/lib/actions/feed.actions";
import { Button } from "@/components/ui/button";

export default function PostMenu({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      aria-label="Delete post"
      type="button"
      variant="ghost"
      size="icon"
      className="feed-menu-trigger"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await deletePost(postId);
        })
      }
    >
      <X className="feed-menu-icon h-4 w-4" />
    </Button>
  );
}
