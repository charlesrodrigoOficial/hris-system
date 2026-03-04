"use server";

import { prisma } from "@/db/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

  revalidatePath("/user"); // change to your feed page route
  return { success: true, message: "Posted" };
}

export async function toggleReaction(postId: string) {
  const session = await auth();
  if (!session?.user?.id)
    return { success: false, message: "Not authenticated" };

  const existing = await prisma.feedReaction.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.feedReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.feedReaction.create({
      data: { postId, userId: session.user.id },
    });
  }

  revalidatePath("/user");
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

  revalidatePath("/user");
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

  const role = (session.user as any).role as string | undefined;
  const canDelete =
    post.authorId === session.user.id || ["ADMIN", "HR"].includes(role ?? "");
  if (!canDelete) return { success: false, message: "Not authorized" };

  await prisma.feedPost.delete({ where: { id: postId } });
  revalidatePath("/user");
  return { success: true, message: "Deleted" };
}
