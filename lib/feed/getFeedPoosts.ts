import { prisma } from "@/db/prisma";
import { FEED_REACTIONS, FEED_REACTION_TYPES, type FeedReactionType } from "@/lib/feed/reactions";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export async function getFeedPosts(viewerId?: string | null) {
  const dbPosts = await prisma.feedPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      author: { select: { name: true, role: true, image: true } },
      birthdayUser: { select: { id: true, name: true, image: true } },
      reactions: { select: { userId: true, type: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        take: 5,
        include: { user: { select: { name: true } } },
      },
    },
  });

  return dbPosts.map((p) => {
    const reactionSummary = FEED_REACTION_TYPES.map((type) => ({
      type,
      emoji: FEED_REACTIONS[type].emoji,
      label: FEED_REACTIONS[type].label,
      count: p.reactions.filter((reaction) => reaction.type === type).length,
    })).filter((reaction) => reaction.count > 0);

    return {
      id: p.id,
      authorName: p.author?.name ?? "Unknown",
      authorRole: p.author?.role ?? "",
      authorImage: p.author?.image ?? null,

      createdAtLabel: formatDate(p.createdAt),
      body: p.content,

      type: p.type,
      imageUrl: (p as any).imageUrl ?? null,
      birthdayUserName: p.birthdayUser?.name ?? null,
      birthdayUserImage: p.birthdayUser?.image ?? null,
      pollQuestion: p.pollQuestion,
      pollOptions: (p.pollOptions as unknown as string[]) ?? [],

      reactionsCount: p.reactions.length,
      myReactionType: viewerId
        ? (p.reactions.find((r) => r.userId === viewerId)?.type as FeedReactionType | undefined)
        : undefined,
      reactionSummary,

      comments: p.comments.map((c) => ({
        id: c.id,
        authorName: c.user?.name ?? "Unknown",
        content: c.content,
        createdAtLabel: formatDate(c.createdAt),
      })),
    };
  });
}
