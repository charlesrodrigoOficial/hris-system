"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, MessageSquare, Smile } from "lucide-react";

type FeedPost = {
  id: string;
  authorName: string;
  authorRole?: string;
  createdAtLabel: string;
  body: string;
};

export function FeedPostCard({ post }: { post: FeedPost }) {
  return (
    <Card className="rounded-2xl shadow-sm">
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

        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="px-4 pb-4 text-sm text-foreground/90">
        {post.body}
        <span className="ml-2 text-muted-foreground underline cursor-pointer">
          See more...
        </span>
      </CardContent>

      <CardFooter className="flex items-center justify-around border-t p-3">
        <Button variant="ghost" className="gap-2">
          <Smile className="h-4 w-4" />
          React
        </Button>
        <Button variant="ghost" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Comment
        </Button>
      </CardFooter>
    </Card>
  );
}
