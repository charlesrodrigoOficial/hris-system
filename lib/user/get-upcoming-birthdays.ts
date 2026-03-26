import { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

type BirthdayWishSummary = {
  userId: string;
  name: string | null;
  image: string | null;
};

type BirthdayWishDelegate = {
  findMany: (args: {
    where: {
      OR: {
        birthdayUserId: string;
        wishDate: Date;
      }[];
    };
    select: {
      birthdayUserId: true;
      wishDate: true;
      wishedBy: {
        select: {
          id: true;
          name: true;
          image: true;
        };
      };
    };
    orderBy: {
      createdAt: "asc";
    };
  }) => Promise<
    {
      birthdayUserId: string;
      wishDate: Date;
      wishedBy: {
        id: string;
        name: string | null;
        image: string | null;
      };
    }[]
  >;
};

type UpcomingBirthday = {
  id: string;
  name: string;
  image?: string | null;
  position?: string | null;
  subtitle: string;
  wishDate: Date;
  wishes: BirthdayWishSummary[];
  daysUntilBirthday: number;
};

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function getNextBirthday(dateOfBirth: Date, now: Date) {
  const month = dateOfBirth.getUTCMonth();
  const day = dateOfBirth.getUTCDate();
  const today = startOfUtcDay(now);
  const isBirthdayMonth = today.getUTCMonth() === month;

  // Keep birthdays visible for the whole birthday month, even after the day passes.
  if (isBirthdayMonth) {
    return new Date(Date.UTC(today.getUTCFullYear(), month, day));
  }

  let nextBirthday = new Date(Date.UTC(today.getUTCFullYear(), month, day));

  if (nextBirthday < today) {
    nextBirthday = new Date(
      Date.UTC(today.getUTCFullYear() + 1, month, day),
    );
  }

  return nextBirthday;
}

function formatBirthdaySubtitle(daysUntilBirthday: number, nextBirthday: Date) {
  if (daysUntilBirthday === 0) {
    return "Today";
  }

  if (daysUntilBirthday === 1) {
    return "Tomorrow";
  }

  return nextBirthday.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function isUpcomingBirthday(
  user: UpcomingBirthday | null,
): user is UpcomingBirthday {
  return user !== null;
}

function isMissingBirthdayWishTable(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

export async function getUpcomingBirthdays(limit = 10) {
  const now = new Date();
  const today = startOfUtcDay(now);

  const users = await prisma.user.findMany({
    where: {
      dateOfBirth: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
      position: true,
      dateOfBirth: true,
    },
  });

  const upcomingBirthdays = users
    .map((user): UpcomingBirthday | null => {
      const dateOfBirth = user.dateOfBirth;
      if (!dateOfBirth) {
        return null;
      }

      const nextBirthday = getNextBirthday(dateOfBirth, now);
      const daysUntilBirthday = Math.round(
        (nextBirthday.getTime() - today.getTime()) / MS_PER_DAY,
      );

      return {
        id: user.id,
        name: user.name?.trim() || "Employee",
        image: user.image,
        position: user.position,
        subtitle: formatBirthdaySubtitle(daysUntilBirthday, nextBirthday),
        wishDate: nextBirthday,
        wishes: [],
        daysUntilBirthday,
      };
    })
    .filter(isUpcomingBirthday);

  const visibleBirthdays = upcomingBirthdays
    .sort((a, b) => {
      if (a.daysUntilBirthday !== b.daysUntilBirthday) {
        return a.daysUntilBirthday - b.daysUntilBirthday;
      }

      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);

  if (visibleBirthdays.length === 0) {
    return [];
  }

  const birthdayWishModel = (
    prisma as typeof prisma & { birthdayWish?: BirthdayWishDelegate }
  ).birthdayWish;

  if (!birthdayWishModel) {
    return visibleBirthdays.map(
      ({ id, name, image, position, subtitle, wishDate }) => ({
      id,
      name,
      image,
      position,
      subtitle,
      wishDate: wishDate.toISOString().slice(0, 10),
      wishes: [],
      }),
    );
  }

  let wishes: {
    birthdayUserId: string;
    wishDate: Date;
    wishedBy: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[] = [];

  try {
    wishes = await birthdayWishModel.findMany({
      where: {
        OR: visibleBirthdays.map(({ id, wishDate }) => ({
          birthdayUserId: id,
          wishDate,
        })),
      },
      select: {
        birthdayUserId: true,
        wishDate: true,
        wishedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  } catch (error) {
    if (!isMissingBirthdayWishTable(error)) {
      throw error;
    }
  }

  const wishesByKey = new Map<string, BirthdayWishSummary[]>();

  for (const wish of wishes) {
    const wishKey = `${wish.birthdayUserId}:${wish.wishDate.toISOString().slice(0, 10)}`;
    const existing = wishesByKey.get(wishKey) ?? [];

    existing.push({
      userId: wish.wishedBy.id,
      name: wish.wishedBy.name,
      image: wish.wishedBy.image,
    });

    wishesByKey.set(wishKey, existing);
  }

  return visibleBirthdays.map(({ id, name, image, position, subtitle, wishDate }) => {
    const wishKey = `${id}:${wishDate.toISOString().slice(0, 10)}`;

    return {
      id,
      name,
      image,
      position,
      subtitle,
      wishDate: wishDate.toISOString().slice(0, 10),
      wishes: wishesByKey.get(wishKey) ?? [],
    };
  });
}
