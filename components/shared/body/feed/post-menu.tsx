"use client";

import { deletePost } from "@/lib/actions/feed.actions";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";

export default function PostMenu({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={() => startTransition(async () => { await deletePost(postId); })}
    >
      ⋮
    </Button>
  );
}