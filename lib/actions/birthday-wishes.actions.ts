"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type BirthdayWishDelegate = {
  create: (args: {
    data: {
      birthdayUserId: string;
      wishedById: string;
      wishDate: Date;
    };
  }) => Promise<unknown>;
  findFirst?: (args: {
    where: {
      birthdayUserId: string;
      wishedById: string;
      wishDate: Date;
    };
    
    select: {
      id: true;
    };
  }) => Promise<{ id: string } | null>;
};

type BirthdayWishSession = {
  user: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
};

const sendBirthdayWishSchema = z.object({
  birthdayUserId: z.string().uuid("Invalid employee"),
  wishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid wish date"),
});

function parseUtcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function getTodayUtc() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function isMissingBirthdayWishTable(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

function isDuplicateBirthdayWish(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function buildSuccessPayload(session: BirthdayWishSession) {
  return {
    success: true as const,
    wish: {
      userId: session.user.id,
      name: session.user.name ?? "Employee",
      image: session.user.image ?? null,
    },
  };
}

export async function sendBirthdayWish(
  birthdayUserId: string,
  wishDate: string,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Not authenticated" };
  }

  const birthdayWishSession: BirthdayWishSession = {
    user: {
      id: session.user.id,
      name: session.user.name,
      image: session.user.image,
    },
  };

  const parsed = sendBirthdayWishSchema.safeParse({ birthdayUserId, wishDate });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid birthday wish",
    };
  }

  const targetWishDate = parseUtcDate(parsed.data.wishDate);
  const today = getTodayUtc();

  if (targetWishDate < today) {
    return { success: false, message: "This birthday wish has expired" };
  }

  const birthdayWishModel = (
    prisma as typeof prisma & { birthdayWish?: BirthdayWishDelegate }
  ).birthdayWish;

  if (!birthdayWishModel) {
    return {
      success: false,
      message: "Birthday wishes are not ready yet. Restart the app server.",
    };
  }

  const existingWish = await birthdayWishModel.findFirst?.({
    where: {
      birthdayUserId: parsed.data.birthdayUserId,
      wishedById: session.user.id,
      wishDate: targetWishDate,
    },
    select: {
      id: true,
    },
  });

  if (existingWish) {
    return buildSuccessPayload(birthdayWishSession);
  }

  try {
    await birthdayWishModel.create({
      data: {
        birthdayUserId: parsed.data.birthdayUserId,
        wishedById: session.user.id,
        wishDate: targetWishDate,
      },
    });
  } catch (error) {
    if (isMissingBirthdayWishTable(error)) {
      return {
        success: false,
        message:
          "Birthday wishes table is not in the database yet. Run the migration first.",
      };
    }

    if (isDuplicateBirthdayWish(error)) {
      return {
        success: false,
        message:
          "This wish was not saved in the database yet. Update the BirthdayWish schema in the DB with `npx prisma db push`, then run `npx prisma generate` and restart the app.",
      };
    }

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/user/profile");

  return buildSuccessPayload(birthdayWishSession);
}
