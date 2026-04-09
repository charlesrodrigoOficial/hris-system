import { NextResponse } from "next/server";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";
import { CompanyDocumentCategory } from "@prisma/client";
import { isHrManager, isSuperAdmin } from "@/lib/auth/rbac";

export const runtime = "nodejs";

function isSupportedUpload(file: File | null): file is File {
  if (!file) return false;

  return ["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(
    file.type,
  );
}

function actorLabel(user: any) {
  return (
    String(user?.fullName ?? "").trim() ||
    String(user?.name ?? "").trim() ||
    String(user?.email ?? "").trim() ||
    "HR"
  );
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSuperAdmin(user.role) && !isHrManager(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const title = String(formData.get("title") ?? "").trim();
    const categoryRaw = String(formData.get("category") ?? "").trim();
    const fileEntry = formData.get("file");
    const file = fileEntry instanceof File ? fileEntry : null;

    const categoryValues = Object.values(CompanyDocumentCategory);
    const category = categoryValues.includes(categoryRaw as any)
      ? (categoryRaw as CompanyDocumentCategory)
      : null;

    if (!category) {
      return NextResponse.json(
        { error: "Please select a valid document category." },
        { status: 400 },
      );
    }

    if (!isSupportedUpload(file)) {
      return NextResponse.json(
        { error: "Uploaded file must be a PDF or image file." },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Uploaded file must be 10MB or smaller." },
        { status: 400 },
      );
    }

    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "company-documents",
    );
    await mkdir(uploadsDir, { recursive: true });

    const extension = path.extname(file.name) || ".bin";
    const storedFileName = `${randomUUID()}${extension}`;
    const filePath = path.join(uploadsDir, storedFileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filePath, buffer);

    const created = await prisma.companyDocument.create({
      data: {
        title: title || file.name,
        category,
        fileName: file.name,
        fileUrl: `/uploads/company-documents/${storedFileName}`,
        fileType: file.type || null,
        fileSize: file.size,
        sourceLabel: "HR Upload",
        uploadedBy: actorLabel(user),
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Failed to upload company document", error);
    return NextResponse.json(
      { error: "Failed to upload company document." },
      { status: 500 },
    );
  }
}
