"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

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

const createBirthdayWishPostSchema = z.object({
  birthdayUserId: z.string().uuid("Invalid employee"),
  wishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid wish date"),
  content: z
    .string()
    .trim()
    .max(500, "Wish is too long (max 500 characters)")
    .optional(),
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

function isWishDateExpired(targetWishDate: Date, today: Date) {
  if (targetWishDate >= today) {
    return false;
  }

  // Birthday cards stay visible for the full birthday month in the UI,
  // so allow wishing for earlier days within the same UTC month/year.
  return !(
    targetWishDate.getUTCFullYear() === today.getUTCFullYear() &&
    targetWishDate.getUTCMonth() === today.getUTCMonth()
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

function isMissingFieldOrColumn(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022"
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

function getImageExtension(mimeType: string) {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  return "";
}

function isSupportedWishImage(file: File | null) {
  if (!file) return true;
  return ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
    file.type,
  );
}

async function saveWishImage(file: File) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "feed", "birthdays");
  await mkdir(uploadsDir, { recursive: true });

  const extFromName = path.extname(file.name);
  const extension = extFromName || getImageExtension(file.type) || ".bin";
  const fileName = `birthday-${randomUUID()}${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);
  return `/uploads/feed/birthdays/${fileName}`;
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

  if (isWishDateExpired(targetWishDate, today)) {
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

export async function createBirthdayWishPost(prev: any, formData: FormData) {
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

  const rawBirthdayUserId = String(formData.get("birthdayUserId") ?? "");
  const rawWishDate = String(formData.get("wishDate") ?? "");
  const rawContent = String(formData.get("content") ?? "").trim();
  const imageEntry = formData.get("image");
  const imageFile =
    imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;

  const parsed = createBirthdayWishPostSchema.safeParse({
    birthdayUserId: rawBirthdayUserId,
    wishDate: rawWishDate,
    content: rawContent ? rawContent : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid birthday wish",
    };
  }

  if (!isSupportedWishImage(imageFile)) {
    return {
      success: false,
      message: "Image must be PNG, JPG, WEBP, or GIF.",
    };
  }

  if (imageFile && imageFile.size > 5 * 1024 * 1024) {
    return {
      success: false,
      message: "Image must be 5MB or smaller.",
    };
  }

  const targetWishDate = parseUtcDate(parsed.data.wishDate);
  const today = getTodayUtc();

  if (isWishDateExpired(targetWishDate, today)) {
    return { success: false, message: "This birthday wish has expired" };
  }

  const birthdayUser = await prisma.user.findUnique({
    where: { id: parsed.data.birthdayUserId },
    select: { id: true, name: true, image: true },
  });

  if (!birthdayUser) {
    return { success: false, message: "Employee not found" };
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
    select: { id: true },
  });

  if (existingWish) {
    return {
      ...buildSuccessPayload(birthdayWishSession),
      message: "You already sent a wish.",
    };
  }

  let imageUrl: string | null = null;
  if (imageFile) {
    imageUrl = await saveWishImage(imageFile);
  }

  const content =
    parsed.data.content?.trim() ||
    `Happy Birthday, ${birthdayUser.name?.trim() || "Employee"}!`;

  try {
    await prisma.$transaction(async (tx) => {
      await (tx as typeof prisma).birthdayWish.create({
        data: {
          birthdayUserId: parsed.data.birthdayUserId,
          wishedById: session.user.id,
          wishDate: targetWishDate,
        },
      });

      await (tx as typeof prisma).feedPost.create({
        data: {
          type: "BIRTHDAY",
          content,
          imageUrl,
          birthdayUserId: parsed.data.birthdayUserId,
          authorId: session.user.id,
        } as any,
      });
    });
  } catch (error) {
    if (isMissingBirthdayWishTable(error)) {
      return {
        success: false,
        message:
          "Birthday wishes table is not in the database yet. Run the migration first.",
      };
    }

    if (isMissingFieldOrColumn(error)) {
      return {
        success: false,
        message:
          "Birthday feed posts are not in the database yet. Update the DB schema (run `npx prisma db push`, then `npx prisma generate`) and restart the app.",
      };
    }

    if (isDuplicateBirthdayWish(error)) {
      return {
        ...buildSuccessPayload(birthdayWishSession),
        message: "You already sent a wish.",
      };
    }

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/user/profile");

  return { ...buildSuccessPayload(birthdayWishSession), message: "Wish posted" };
}
