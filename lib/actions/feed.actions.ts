"use server";

import { prisma } from "@/db/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canCreateFeedPost, canManageFeed } from "@/lib/auth/roles";
import { FEED_REACTION_TYPES } from "@/lib/feed/reactions";

const createPostSchema = z.object({
  type: z.enum(["SHOUTOUT", "KUDOS", "POLL"]),
  content: z.string().min(1, "Write something first"),
  pollQuestion: z.string().optional(),
  pollOptions: z.array(z.string().min(1)).optional(),
});

export async function createFeedPost(prev: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, message: "Not authenticated" };
  if (!canCreateFeedPost(session.user.role))
    return {
      success: false,
      message: "Only Super Admin and HR Manager can create posts",
    };

  const raw = {
    type: String(formData.get("type") ?? "SHOUTOUT"),
    content: String(formData.get("content") ?? ""),
    pollQuestion: formData.get("pollQuestion")
      ? String(formData.get("pollQuestion"))
      : undefined,
    pollOptions: formData.getAll("pollOptions").map(String).filter(Boolean),
  };

  const parsed = createPostSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid data",
    };
  }

  const { type, content, pollQuestion, pollOptions } = parsed.data;

  await prisma.feedPost.create({
    data: {
      type,
      content,
      authorId: session.user.id,
      pollQuestion: type === "POLL" ? (pollQuestion ?? null) : null,
      pollOptions: type === "POLL" ? (pollOptions ?? []) : undefined,
    } as any,
  });

  revalidateFeedPaths();
  return { success: true, message: "Posted" };
}

const reactionSchema = z.object({
  postId: z.string().uuid("Invalid post"),
  reactionType: z.enum(FEED_REACTION_TYPES),
});

export async function setReaction(postId: string, reactionType: string) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, message: "Not authenticated" };

  const parsed = reactionSchema.safeParse({ postId, reactionType });
  if (!parsed.success)
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid reaction",
    };

  const { postId: validPostId, reactionType: validReactionType } = parsed.data;

  const existing = await prisma.feedReaction.findUnique({
    where: { postId_userId: { postId: validPostId, userId: session.user.id } },
    select: { id: true, type: true },
  });

  if (existing?.type === validReactionType) {
    await prisma.feedReaction.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.feedReaction.update({
      where: { id: existing.id },
      data: { type: validReactionType },
    });
  } else {
    await prisma.feedReaction.create({
      data: {
        postId: validPostId,
        userId: session.user.id,
        type: validReactionType,
      },
    });
  }

  revalidateFeedPaths();
  return { success: true };
}

export async function addComment(prev: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, message: "Not authenticated" };

  const postId = String(formData.get("postId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!postId || !content)
    return { success: false, message: "Comment is empty" };

  await prisma.feedComment.create({
    data: { postId, userId: session.user.id, content },
  });

  revalidateFeedPaths();
  return { success: true, message: "Comment added" };
}

export async function deletePost(postId: string) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, message: "Not authenticated" };

  const post = await prisma.feedPost.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post) return { success: false, message: "Post not found" };

  if (!canManageFeed(session.user.role))
    return {
      success: false,
      message: "Only Super Admin and HR Manager can delete posts",
    };

  await prisma.feedPost.delete({ where: { id: postId } });
  revalidateFeedPaths();
  return { success: true, message: "Deleted" };
}

export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, message: "Not authenticated" };
  if (!canManageFeed(session.user.role))
    return {
      success: false,
      message: "Only Super Admin and HR Manager can delete comments",
    };

  const comment = await prisma.feedComment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });
  if (!comment) return { success: false, message: "Comment not found" };

  await prisma.feedComment.delete({ where: { id: commentId } });
  revalidateFeedPaths();
  return { success: true, message: "Comment deleted" };
}

function revalidateFeedPaths() {
  revalidatePath("/");
  revalidatePath("/user/profile");
}
