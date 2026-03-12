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
      className="feed-menu-trigger text-slate-600 hover:bg-sky-100 hover:text-slate-900"
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
