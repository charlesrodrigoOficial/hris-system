import type { CreateRequestPayload, RequestRow } from "./types";

export async function fetchRequests(): Promise<RequestRow[]> {
  const res = await fetch("/api/requests", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load requests");
  const data = (await res.json()) as RequestRow[];
  return Array.isArray(data) ? data : [];
}

export async function createRequest(payload: CreateRequestPayload) {
  const formData = new FormData();

  formData.set("type", payload.type);
  formData.set("title", payload.title);

  if (payload.description) {
    formData.set("description", payload.description);
  }

  if (payload.supportRequestType) {
    formData.set("supportRequestType", payload.supportRequestType);
  }

  if (payload.supportRequestTypeOther) {
    formData.set("supportRequestTypeOther", payload.supportRequestTypeOther);
  }

  if (payload.expectedCompletionDate) {
    formData.set("expectedCompletionDate", payload.expectedCompletionDate);
  }

  if (payload.supportAdditionalNotes) {
    formData.set("supportAdditionalNotes", payload.supportAdditionalNotes);
  }

  if (payload.leaveType) {
    formData.set("leaveType", payload.leaveType);
  }

  if (payload.claimPurpose) {
    formData.set("claimPurpose", payload.claimPurpose);
  }

  if (payload.claimPurposeOther) {
    formData.set("claimPurposeOther", payload.claimPurposeOther);
  }

  if (payload.managerEmployeeId) {
    formData.set("managerEmployeeId", payload.managerEmployeeId);
  }

  if (payload.startDate) {
    formData.set("startDate", payload.startDate);
  }

  if (payload.endDate) {
    formData.set("endDate", payload.endDate);
  }

  if (payload.expenseDate) {
    formData.set("expenseDate", payload.expenseDate);
  }

  if (payload.amount != null) {
    formData.set("amount", String(payload.amount));
  }

  if (payload.currency) {
    formData.set("currency", payload.currency);
  }

  if (payload.bankName) {
    formData.set("bankName", payload.bankName);
  }

  if (payload.accountNumber) {
    formData.set("accountNumber", payload.accountNumber);
  }

  if (payload.ibanSwift) {
    formData.set("ibanSwift", payload.ibanSwift);
  }

  if (payload.receiptDocument) {
    formData.set("receiptDocument", payload.receiptDocument);
  }

  if (payload.supportingDocument) {
    formData.set("supportingDocument", payload.supportingDocument);
  }

  const res = await fetch("/api/requests", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(async () => {
      const text = await res.text().catch(() => "");
      return text ? { error: text } : null;
    });
    throw new Error(err?.error ?? `Failed to create request (${res.status})`);
  }

  return res.json();
}
