"use client";

import { useTransition } from "react";
import { setReaction } from "@/lib/actions/feed.actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FEED_REACTIONS,
  FEED_REACTION_TYPES,
  type FeedReactionType,
} from "@/lib/feed/reactions";

export default function ReactButton({
  postId,
  count,
  myReactionType,
}: {
  postId: string;
  count: number;
  myReactionType?: FeedReactionType;
}) {
  const [pending, startTransition] = useTransition();
  const currentReaction = myReactionType ? FEED_REACTIONS[myReactionType] : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={
            myReactionType
              ? "gap-2 text-xs text-slate-900 hover:bg-slate-200 hover:text-black"
              : "gap-2 text-xs text-slate-700 hover:bg-slate-200 hover:text-black"
          }
          disabled={pending}
        >
          <span className="text-base leading-none">
            {currentReaction?.emoji ?? "🙂"}
          </span>
          {currentReaction?.label ?? "React"} {count ? `(${count})` : ""}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-44">
        {FEED_REACTION_TYPES.map((reactionType) => {
          const reaction = FEED_REACTIONS[reactionType];

          return (
            <DropdownMenuItem
              key={reactionType}
              onClick={() =>
                startTransition(async () => {
                  await setReaction(postId, reactionType);
                })
              }
            >
              <span className="text-base leading-none">{reaction.emoji}</span>
              <span>{reaction.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
