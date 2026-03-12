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
      className="h-auto px-2 py-1 text-xs text-destructive hover:text-destructive"
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
    <Card className="rounded-2xl shadow-sm border-b-8">
      <CardHeader className="flex flex-row items-start justify-between gap-3 p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{post.authorName?.[0] ?? "U"}</AvatarFallback>
          </Avatar>

          <div className="leading-tight">
            <div className="font-medium">
              {post.authorName}
              {post.authorRole ? (
                <span className="text-muted-foreground">
                  {" "}
                  • {post.authorRole}
                </span>
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground">
              {post.createdAtLabel}
            </div>
          </div>
        </div>

        {canModerate ? <PostMenu postId={post.id} /> : null}
      </CardHeader>

      <CardContent className="px-4 pb-4 text-sm text-foreground/90">
        {post.body}
        <span className="ml-2 text-muted-foreground underline cursor-pointer">
          
        </span>
      </CardContent>

      <CardFooter className="block border-t p-3">
        <div className="flex items-center justify-between gap-2">
          <ReactButton
            postId={post.id}
            count={post.reactionsCount}
            myReactionType={post.myReactionType}
          />
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            {post.comments.length} Comments
          </div>
        </div>

        {post.reactionSummary.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.reactionSummary.map((reaction) => (
              <div
                key={reaction.type}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
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
              className="rounded-xl bg-slate-50 px-3 py-2 text-sm"
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
              <p className="mt-1 text-xs text-muted-foreground">
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
