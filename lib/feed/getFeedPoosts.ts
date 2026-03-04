import { prisma } from "@/db/prisma";

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
      author: { select: { name: true } },
      reactions: { select: { userId: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        take: 5,
        include: { user: { select: { name: true } } },
      },
    },
  });

  return dbPosts.map((p) => ({
    id: p.id,
    authorName: p.author?.name ?? "Unknown",
    authorRole: "",

    createdAtLabel: formatDate(p.createdAt),
    body: p.content,

    type: p.type,
    pollQuestion: p.pollQuestion,
    pollOptions: (p.pollOptions as unknown as string[]) ?? [],

    reactionsCount: p.reactions.length,
    reactedByMe: viewerId
      ? p.reactions.some((r) => r.userId === viewerId)
      : false,

    comments: p.comments.map((c) => ({
      id: c.id,
      authorName: c.user?.name ?? "Unknown",
      content: c.content,
      createdAtLabel: formatDate(c.createdAt),
    })),
  }));
}