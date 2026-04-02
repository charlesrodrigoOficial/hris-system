import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";

export const runtime = "nodejs";

function getUploadErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as any).code)
      : null;

  switch (code) {
    case "EROFS":
      return "Image upload failed because this server is running on a read-only filesystem. Please contact HR/IT to configure persistent file storage, then try again.";
    case "EACCES":
      return "Image upload failed due to missing server permissions. Please contact HR/IT.";
    case "ENOSPC":
      return "Image upload failed because the server is out of disk space. Please contact HR/IT.";
    default:
      return "Failed to save the uploaded image. Please try again.";
  }
}

function isSupportedImage(file: File) {
  return ["image/png", "image/jpeg", "image/webp"].includes(file.type);
}

function fileExtensionFromType(type: string) {
  switch (type) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const fileEntry = formData.get("image");
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;

  if (!file) {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }

  if (!isSupportedImage(file)) {
    return NextResponse.json(
      { error: "Image must be PNG, JPG, or WEBP." },
      { status: 400 },
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Image must be 5MB or smaller." },
      { status: 400 },
    );
  }

  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "users");
    await mkdir(uploadsDir, { recursive: true });

    const safeExt = fileExtensionFromType(file.type) || ".img";
    const fileName = `${user.id}-${randomUUID()}${safeExt}`;
    const filePath = path.join(uploadsDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return NextResponse.json({ url: `/uploads/users/${fileName}` });
  } catch (error) {
    console.error("Profile image upload failed", error);
    return NextResponse.json(
      { error: getUploadErrorMessage(error) },
      { status: 500 },
    );
  }
}

