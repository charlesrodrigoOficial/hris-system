import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

function buildRequestHref(params: { id: string; type: string }) {
  const focus = encodeURIComponent(params.id);

  if (params.type === "LEAVE") {
    return `/user/requests?mode=leave&focus=${focus}`;
  }

  if (params.type === "SUPPORT" || params.type === "CLAIM") {
    return `/user/requests?mode=support&focus=${focus}`;
  }

  return `/user/requests?focus=${focus}`;
}

function isSupportedUpload(file: File | null) {
  if (!file) return true;

  return ["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(
    file.type,
  );
}

async function saveApprovalDocument(params: { requestId: string; file: File }) {
  const uploadsDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "requests",
    "approvals",
  );
  await mkdir(uploadsDir, { recursive: true });

  const extension = path.extname(params.file.name) || ".bin";
  const storedFileName = `${params.requestId}-${randomUUID()}${extension}`;
  const filePath = path.join(uploadsDir, storedFileName);
  const buffer = Buffer.from(await params.file.arrayBuffer());

  await writeFile(filePath, buffer);

  return {
    filePath,
    originalName: params.file.name,
    storedFileName,
    fileUrl: `/uploads/requests/approvals/${storedFileName}`,
    fileType: params.file.type || null,
    fileSize: params.file.size || null,
  };
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const actor = session?.user;

    if (!actor?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = ["SUPER_ADMIN", "HR_MANAGER"];
    if (!allowed.includes(actor.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const contentType = req.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    const body = isMultipart ? await req.formData() : await req.json();
    const nextStatus = String(
      isMultipart ? body.get("status") : (body as any)?.status ?? "",
    ).toUpperCase();
    const rawNote = isMultipart ? body.get("note") : (body as any)?.note;
    const note =
      typeof rawNote === "string" && rawNote.trim() ? rawNote.trim() : null;

    const approvalDocument = isMultipart
      ? ((body.get("approvalDocument") as any) instanceof File
          ? (body.get("approvalDocument") as File)
          : null)
      : null;

    if (nextStatus !== "APPROVED" && nextStatus !== "REJECTED") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (approvalDocument && nextStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Approval document can only be uploaded when approving." },
        { status: 400 },
      );
    }

    if (!isSupportedUpload(approvalDocument)) {
      return NextResponse.json(
        { error: "Uploaded approval document must be a PDF or image file." },
        { status: 400 },
      );
    }

    if (approvalDocument && approvalDocument.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Approval document must be 5MB or smaller." },
        { status: 400 },
      );
    }

    const current = await prisma.request.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        type: true,
        userId: true,
        managerEmployeeId: true,
      },
    });

    if (!current) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const canChange = ["PENDING", "PROCESSING"].includes(current.status);
    const shouldSaveDoc =
      canChange && nextStatus === "APPROVED" && approvalDocument;

    const savedDoc = shouldSaveDoc
      ? await saveApprovalDocument({ requestId: id, file: approvalDocument! })
      : null;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.request.updateMany({
          where: {
            id,
            status: { in: ["PENDING", "PROCESSING"] },
          },
          data: { status: nextStatus },
        });

        const request = await tx.request.findUnique({ where: { id } });
        if (!request) return { request: null as any, changed: false };

        if (updated.count > 0) {
          await tx.requestActivity.create({
            data: {
              requestId: id,
              actorId: actor.id,
              fromStatus: current.status,
              toStatus: nextStatus,
              note,
            },
          });

          await tx.notification.create({
            data: {
              userId: request.userId,
              title: "Request Status Updated",
              message: `Your request status is now ${request.status}`,
              href: buildRequestHref({ id: request.id, type: request.type }),
            },
          });

          if (savedDoc && nextStatus === "APPROVED") {
            await tx.attachment.create({
              data: {
                requestId: id,
                fileName: savedDoc.originalName,
                fileUrl: savedDoc.fileUrl,
                fileType: savedDoc.fileType,
                fileSize: savedDoc.fileSize ?? undefined,
                attachmentType: "GENERAL",
              },
            });

            if (request.type !== "LEAVE") {
              const actorFullName =
                typeof (actor as any)?.fullName === "string"
                  ? String((actor as any).fullName)
                  : null;
              const uploadedBy =
                actorFullName?.trim() ||
                actor.name?.trim() ||
                actor.email?.trim() ||
                "HR Manager";

              await tx.employeeDocument.create({
                data: {
                  userId: request.userId,
                  title: `Approval - ${request.title}`,
                  category: "EMPLOYMENT",
                  fileName: savedDoc.originalName,
                  fileUrl: savedDoc.fileUrl,
                  fileType: savedDoc.fileType,
                  fileSize: savedDoc.fileSize ?? undefined,
                  sourceLabel: "Request Approval",
                  uploadedBy,
                },
              });
            }
          }
        }

        return { request, changed: updated.count > 0 };
      });

      if (!result.request) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
      }

      return NextResponse.json(result.request);
    } catch (txError) {
      if (savedDoc?.filePath) {
        await unlink(savedDoc.filePath).catch(() => null);
      }
      throw txError;
    }

  } catch (e) {
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 },
    );
  }
}
