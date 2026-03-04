"use client";

import { toggleReaction } from "@/lib/actions/feed.actions";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";

export default function ReactButton({ postId, count }: { postId: string; count: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      className="gap-2"
      disabled={pending}
      onClick={() => startTransition(async () => { await toggleReaction(postId); })}
    >
      🙂 React {count ? `(${count})` : ""}
    </Button>
  );
}