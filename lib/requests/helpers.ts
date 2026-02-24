import type { RequestStatus, RequestType } from "./types";

export const STATUS_META: Record<
  RequestStatus,
  {
    label: string;
    badgeVariant: "secondary" | "default" | "outline" | "destructive";
  }
> = {
  PENDING: { label: "Pending", badgeVariant: "secondary" },
  PROCESSING: { label: "Processing", badgeVariant: "default" },
  APPROVED: { label: "Approved", badgeVariant: "outline" },
  REJECTED: { label: "Rejected", badgeVariant: "destructive" },
};

export function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function typeLabel(t: RequestType) {
  if (t === "LEAVE") return "Leave Request";
  if (t === "CLAIM") return "Claim / Reimbursement";
  return "Support Request";
}

export function validateRequest(input: {
  type: RequestType;
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  amount?: string;
}) {
  const { type, title, description, startDate, endDate, amount } = input;

  if (!title.trim() && type === "SUPPORT")
    return "Title is required for Support requests.";
  if (!description.trim()) return "Please add a message/description.";

  if (type === "LEAVE") {
    if (!startDate || !endDate)
      return "Please select start and end date for leave.";
    if (new Date(endDate).getTime() < new Date(startDate).getTime())
      return "End date must be after start date.";
  }

  if (type === "CLAIM") {
    if (!amount) return "Please enter an amount.";
    if (Number(amount) <= 0) return "Amount must be greater than 0.";
  }

  return null;
}

export function buildPayload(input: {
  type: RequestType;
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  amount?: string;
  currency?: string;
}) {
  const { type, title, description, startDate, endDate, amount, currency } =
    input;

  let payload: any = {
    type,
    title: title.trim(),
    description: description.trim() || null,
  };

  if (!payload.title) {
    payload.title = typeLabel(type);
  }

  if (type === "LEAVE") {
    payload.startDate = startDate ? new Date(startDate).toISOString() : null;
    payload.endDate = endDate ? new Date(endDate).toISOString() : null;
  }

  if (type === "CLAIM") {
    payload.amount = amount ? Number(amount) : null;
    payload.currency = currency || "GBP";
  }

  return payload;
}
