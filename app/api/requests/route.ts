import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";
import { buildPayload, validateRequest } from "@/lib/requests/helpers";
import type {
  ClaimPurpose,
  LeaveRequestType,
  RequestAttachmentType,
  RequestType,
  SupportRequestType,
} from "@/lib/requests/types";

export const runtime = "nodejs";

async function saveAttachment(params: {
  requestId: string;
  file: File;
  attachmentType: RequestAttachmentType;
}) {
  const { requestId, file, attachmentType } = params;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "requests");
  await mkdir(uploadsDir, { recursive: true });

  const extension = path.extname(file.name) || ".bin";
  const fileName = `${requestId}-${randomUUID()}${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  await prisma.attachment.create({
    data: {
      requestId,
      fileName: file.name,
      fileUrl: `/uploads/requests/${fileName}`,
      fileType: file.type || null,
      fileSize: file.size,
      attachmentType,
    },
  });
}

function isSupportedUpload(file: File | null) {
  if (!file) return true;

  return ["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(
    file.type,
  );
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.request.findMany({
    where: { userId: session.user.id },
    include: {
      attachments: {
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          attachmentType: true,
        },
      },
      managerEmployee: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const type = String(formData.get("type") || "") as RequestType;
    const title = String(formData.get("title") || "");
    const description = String(formData.get("description") || "");
    const supportRequestType = String(
      formData.get("supportRequestType") || "",
    ) as SupportRequestType | "";
    const supportRequestTypeOther = String(
      formData.get("supportRequestTypeOther") || "",
    );
    const expectedCompletionDate = String(
      formData.get("expectedCompletionDate") || "",
    );
    const supportAdditionalNotes = String(
      formData.get("supportAdditionalNotes") || "",
    );
    const leaveType = String(formData.get("leaveType") || "") as
      | LeaveRequestType
      | "";
    const claimPurpose = String(formData.get("claimPurpose") || "") as
      | ClaimPurpose
      | "";
    const claimPurposeOther = String(formData.get("claimPurposeOther") || "");
    const managerEmployeeId = String(formData.get("managerEmployeeId") || "");
    const startDate = String(formData.get("startDate") || "");
    const endDate = String(formData.get("endDate") || "");
    const expenseDate = String(formData.get("expenseDate") || "");
    const amount = String(formData.get("amount") || "");
    const currency = String(formData.get("currency") || "");
    const bankName = String(formData.get("bankName") || "");
    const accountNumber = String(formData.get("accountNumber") || "");
    const ibanSwift = String(formData.get("ibanSwift") || "");
    const receiptDocumentEntry = formData.get("receiptDocument");
    const supportingDocumentEntry = formData.get("supportingDocument");
    const receiptDocument =
      receiptDocumentEntry instanceof File && receiptDocumentEntry.size > 0
        ? receiptDocumentEntry
        : null;
    const supportingDocument =
      supportingDocumentEntry instanceof File &&
      supportingDocumentEntry.size > 0
        ? supportingDocumentEntry
        : null;

    const error = validateRequest({
      type,
      title,
      description,
      supportRequestType,
      supportRequestTypeOther,
      expectedCompletionDate,
      supportAdditionalNotes,
      leaveType,
      claimPurpose,
      claimPurposeOther,
      managerEmployeeId,
      startDate,
      endDate,
      expenseDate,
      amount,
      bankName,
      accountNumber,
      ibanSwift,
      receiptDocument,
      supportingDocument,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    if (managerEmployeeId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerEmployeeId },
        select: { id: true },
      });

      if (!manager) {
        return NextResponse.json(
          { error: "Selected manager does not exist." },
          { status: 400 },
        );
      }
    }

    if (
      !isSupportedUpload(receiptDocument) ||
      !isSupportedUpload(supportingDocument)
    ) {
      return NextResponse.json(
        { error: "Uploaded files must be PDF or image files." },
        { status: 400 },
      );
    }

    if (
      (receiptDocument && receiptDocument.size > 5 * 1024 * 1024) ||
      (supportingDocument && supportingDocument.size > 5 * 1024 * 1024)
    ) {
      return NextResponse.json(
        { error: "Each uploaded file must be 5MB or smaller." },
        { status: 400 },
      );
    }

    const payload = buildPayload({
      type,
      title,
      description,
      supportRequestType,
      supportRequestTypeOther,
      expectedCompletionDate,
      supportAdditionalNotes,
      leaveType,
      claimPurpose,
      claimPurposeOther,
      managerEmployeeId,
      startDate,
      endDate,
      expenseDate,
      amount,
      currency,
      bankName,
      accountNumber,
      ibanSwift,
      receiptDocument,
      supportingDocument,
    });

    const created = await prisma.request.create({
      data: {
        type: payload.type,
        title: payload.title,
        description: payload.description ?? null,
        status: "PENDING",
        userId: session.user.id,
        supportRequestType: payload.supportRequestType ?? null,
        supportRequestTypeOther: payload.supportRequestTypeOther ?? null,
        expectedCompletionDate: payload.expectedCompletionDate ?? null,
        supportAdditionalNotes: payload.supportAdditionalNotes ?? null,
        leaveType: payload.leaveType ?? null,
        claimPurpose: payload.claimPurpose ?? null,
        claimPurposeOther: payload.claimPurposeOther ?? null,
        startDate: payload.startDate ?? null,
        endDate: payload.endDate ?? null,
        expenseDate: payload.expenseDate ?? null,
        managerEmployeeId: payload.managerEmployeeId ?? null,
        bankName: payload.bankName ?? null,
        accountNumber: payload.accountNumber ?? null,
        ibanSwift: payload.ibanSwift ?? null,
        amount: payload.amount ?? null,
        currency: payload.currency ?? null,
      },
    });

    if (receiptDocument) {
      await saveAttachment({
        requestId: created.id,
        file: receiptDocument,
        attachmentType: "CLAIM_RECEIPT",
      });
    }

    if (supportingDocument) {
      await saveAttachment({
        requestId: created.id,
        file: supportingDocument,
        attachmentType: "MANAGER_APPROVAL",
      });
    }

    return NextResponse.json(created);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create request";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
