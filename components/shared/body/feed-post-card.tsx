"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useTransition } from "react";
import ReactButton from "@/components/shared/body/feed/react-button";
import CommentForm from "@/components/shared/body/feed/comment-form";
import PostMenu from "@/components/shared/body/feed/post-menu";
import { deleteComment } from "@/lib/actions/feed.actions";
import { type FeedReactionType } from "@/lib/feed/reactions";

type FeedPost = {
  id: string;
  authorName: string;
  authorRole?: string;
  createdAtLabel: string;
  body: string;
  reactionsCount: number;
  myReactionType?: FeedReactionType;
  reactionSummary: {
    type: FeedReactionType;
    emoji: string;
    label: string;
    count: number;
  }[];
  comments: {
    id: string;
    authorName: string;
    content: string;
    createdAtLabel: string;
  }[];
};

function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto px-2 py-1 text-xs text-red-600 hover:bg-sky-100 hover:text-red-700"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await deleteComment(commentId);
        })
      }
    >
      Delete
    </Button>
  );
}

export function FeedPostCard({
  post,
  canModerate,
}: {
  post: FeedPost;
  canModerate: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-lg border border-slate-300/70 bg-gradient-to-b from-slate-300 via-slate-100 to-slate-200 shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-3 p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-slate-100 text-slate-900">
              {post.authorName?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>

          <div className="leading-tight">
            <div className="font-medium">
              {post.authorName}
              {post.authorRole ? (
                <span className="ml-1 text-xs font-normal text-slate-800">
                  {" "}
                  • {post.authorRole}
                </span>
              ) : null}
            </div>
            <div className="text-xs text-slate-800">
              {post.createdAtLabel}
            </div>
          </div>
        </div>

        {canModerate ? <PostMenu postId={post.id} /> : null}
      </CardHeader>

      <CardContent className="px-4 pb-4 text-xs text-slate-700">
        {post.body}
        <span className="ml-2 cursor-pointer text-slate-500 underline">
          
        </span>
      </CardContent>

      <CardFooter className="block border-t border-slate-300/70 p-3">
        <div className="flex items-center justify-between gap-2">
          <ReactButton
            postId={post.id}
            count={post.reactionsCount}
            myReactionType={post.myReactionType}
          />
          <div className="inline-flex items-center gap-2 text-xs text-slate-500">
            <MessageSquare className="h-4 w-4" />
            {post.comments.length} Comments
          </div>
        </div>

        {post.reactionSummary.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.reactionSummary.map((reaction) => (
              <div
                key={reaction.type}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white/80 px-2.5 py-1 text-xs text-slate-700"
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-3 space-y-3">
          {post.comments.map((comment) => (
            <div
              key={comment.id}
              className="dashboard-gradient-soft rounded-xl px-3 py-2 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{comment.authorName}</p>
                  <p className="text-slate-700">{comment.content}</p>
                </div>
                {canModerate ? (
                  <DeleteCommentButton commentId={comment.id} />
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {comment.createdAtLabel}
              </p>
            </div>
          ))}

          <CommentForm postId={post.id} />
        </div>
      </CardFooter>
    </Card>
  );
}
