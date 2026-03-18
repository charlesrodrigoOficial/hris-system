import type {
  ClaimPurpose,
  CreateRequestPayload,
  LeaveRequestType,
  RequestStatus,
  SupportRequestType,
  RequestType,
} from "./types";

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

export const SUPPORT_REQUEST_OPTIONS: Array<{
  value: SupportRequestType;
  label: string;
}> = [
  { value: "RECOMMENDATION_LETTER", label: "Recommendation Letter" },
  { value: "EMPLOYMENT_VERIFICATION", label: "Employment Verification" },
  { value: "PROOF_OF_INCOME", label: "Proof of Income" },
  { value: "CONTRACT_COPY", label: "Contract Copy" },
  {
    value: "OPERATIONAL_REQUEST",
    label: "Operational Request (equipment, software access, etc)",
  },
  { value: "OTHER", label: "Other" },
];

export const LEAVE_TYPE_OPTIONS: Array<{
  value: LeaveRequestType;
  label: string;
}> = [
  { value: "PAID_VACATION_LEAVE", label: "Paid Vacation Leave" },
  { value: "SICK_LEAVE", label: "Sick Leave" },
  { value: "URGENT_LEAVE", label: "Urgent Leave" },
  { value: "MATERNITY_LEAVE", label: "Maternity Leave" },
  { value: "PATERNITY_LEAVE", label: "Paternity Leave" },
  { value: "BEREAVEMENT_LEAVE", label: "Bereavement Leave" },
  { value: "UNPAID_LEAVE", label: "Unpaid Leave" },
  { value: "MENTAL_WELLNESS_DAY", label: "Mental Wellness Day" },
];

export const CLAIM_PURPOSE_OPTIONS: Array<{
  value: ClaimPurpose;
  label: string;
}> = [
  { value: "TEAM_MEAL_OR_COFFEE", label: "Team Meal or Coffee" },
  {
    value: "EMPLOYEE_ENGAGEMENT_WINNER",
    label: "Employee Engagement Winner",
  },
  {
    value: "BEST_EMPLOYEE_RECOGNITION",
    label: "Best Employee Recognition",
  },
  { value: "BIRTHDAY_VOUCHER", label: "Birthday Voucher" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "OFFICE_SUPPLIES", label: "Office Supplies" },
  {
    value: "TRAINING_CERTIFICATION_COURSES",
    label: "Training/Certification/Courses",
  },
  { value: "OTHER", label: "Other" },
];

export function leaveTypeLabel(value: LeaveRequestType) {
  return (
    LEAVE_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    "Leave Request"
  );
}

export function isAdmin(role?: string | null) {
  return role === "ADMIN";
}

export function claimPurposeLabel(value: ClaimPurpose) {
  return (
    CLAIM_PURPOSE_OPTIONS.find((option) => option.value === value)?.label ??
    "Claim"
  );
}

export function supportRequestLabel(value: SupportRequestType) {
  return (
    SUPPORT_REQUEST_OPTIONS.find((option) => option.value === value)?.label ??
    "Support Request"
  );
}

function toDateOnlyIso(value: string) {
  const trimmed = value.trim();
  const datePart = trimmed.includes("T") ? trimmed.slice(0, 10) : trimmed;
  const normalized = new Date(`${datePart}T00:00:00.000Z`);

  if (Number.isNaN(normalized.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return normalized.toISOString();
}

export function validateRequest(input: {
  type: RequestType;
  title: string;
  description: string;
  supportRequestType?: SupportRequestType | "";
  supportRequestTypeOther?: string;
  expectedCompletionDate?: string;
  supportAdditionalNotes?: string;
  leaveType?: LeaveRequestType | "";
  claimPurpose?: ClaimPurpose | "";
  claimPurposeOther?: string;
  managerEmployeeId?: string;
  startDate?: string;
  endDate?: string;
  expenseDate?: string;
  amount?: string;
  bankName?: string;
  accountNumber?: string;
  ibanSwift?: string;
  receiptDocument?: File | null;
  supportingDocument?: File | null;
}) {
  const {
    type,
    title,
    description,
    supportRequestType,
    supportRequestTypeOther,
    expectedCompletionDate,
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
  } = input;

  if (type === "SUPPORT") {
    if (!supportRequestType) {
      return "Please select the type of request.";
    }
    if (supportRequestType === "OTHER" && !supportRequestTypeOther?.trim()) {
      return "Please specify the support request type.";
    }
    if (!description.trim()) {
      return "Please add the purpose of the request.";
    }
    if (!expectedCompletionDate) {
      return "Please select the expected completion date.";
    }
  }

  if (type === "LEAVE") {
    if (!description.trim()) return "Please add a message/description.";
    if (!leaveType) return "Please select the type of leave.";
    if (!managerEmployeeId?.trim()) return "Please select your manager.";
    if (!startDate || !endDate) {
      return "Please select start and end date for leave.";
    }
    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      return "End date must be after start date.";
    }
    if (!supportingDocument || supportingDocument.size === 0) {
      return "Please upload the manager approval document.";
    }
  }

  if (type === "CLAIM") {
    if (!claimPurpose) return "Please select the purpose of the claim.";
    if (claimPurpose === "OTHER" && !claimPurposeOther?.trim()) {
      return "Please describe the claim purpose.";
    }
    if (!expenseDate) return "Please select the date of expense.";
    if (!amount) return "Please enter an amount.";
    if (Number(amount) <= 0) return "Amount must be greater than 0.";
    if (!bankName?.trim()) return "Please enter the bank name.";
    if (!accountNumber?.trim()) return "Please enter the account number.";
    if (!ibanSwift?.trim()) return "Please enter the IBAN/SWIFT.";
    if (!managerEmployeeId?.trim()) return "Please select your manager.";
    if (!receiptDocument || receiptDocument.size === 0) {
      return "Please upload the receipt or proof of payment.";
    }
    if (!supportingDocument || supportingDocument.size === 0) {
      return "Please upload the manager approval document.";
    }
  }

  return null;
}

export function buildPayload(input: {
  type: RequestType;
  title: string;
  description: string;
  supportRequestType?: SupportRequestType | "";
  supportRequestTypeOther?: string;
  expectedCompletionDate?: string;
  supportAdditionalNotes?: string;
  leaveType?: LeaveRequestType | "";
  claimPurpose?: ClaimPurpose | "";
  claimPurposeOther?: string;
  managerEmployeeId?: string;
  startDate?: string;
  endDate?: string;
  expenseDate?: string;
  amount?: string;
  currency?: string;
  bankName?: string;
  accountNumber?: string;
  ibanSwift?: string;
  receiptDocument?: File | null;
  supportingDocument?: File | null;
}): CreateRequestPayload {
  const {
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
  } = input;

  const payload: CreateRequestPayload = {
    type,
    title: title.trim(),
    description: description.trim() || null,
    supportRequestType: supportRequestType || null,
    supportRequestTypeOther: supportRequestTypeOther?.trim() || null,
    expectedCompletionDate: expectedCompletionDate
      ? toDateOnlyIso(expectedCompletionDate)
      : null,
    supportAdditionalNotes: supportAdditionalNotes?.trim() || null,
    leaveType: leaveType || null,
    claimPurpose: claimPurpose || null,
    claimPurposeOther: claimPurposeOther?.trim() || null,
    managerEmployeeId: managerEmployeeId?.trim() || null,
    receiptDocument: receiptDocument ?? null,
    supportingDocument: supportingDocument ?? null,
  };

  if (!payload.title) {
    payload.title = typeLabel(type);
  }

  if (type === "SUPPORT") {
    payload.title =
      supportRequestType === "OTHER"
        ? supportRequestTypeOther?.trim() || "Other Support Request"
        : supportRequestType
          ? supportRequestLabel(supportRequestType)
          : payload.title;
    payload.description = description.trim() || null;
  }

  if (type === "LEAVE") {
    payload.title = leaveType ? leaveTypeLabel(leaveType) : payload.title;
    payload.description = description.trim() || null;
    payload.startDate = startDate ? toDateOnlyIso(startDate) : null;
    payload.endDate = endDate ? toDateOnlyIso(endDate) : null;
  }

  if (type === "CLAIM") {
    payload.title =
      claimPurpose === "OTHER"
        ? claimPurposeOther?.trim() || "Other Claim"
        : claimPurpose
          ? claimPurposeLabel(claimPurpose)
          : payload.title;
    payload.description = null;
    payload.expenseDate = expenseDate ? toDateOnlyIso(expenseDate) : null;
    payload.amount = amount ? Number(amount) : null;
    payload.currency = currency || "GBP";
    payload.bankName = bankName?.trim() || null;
    payload.accountNumber = accountNumber?.trim() || null;
    payload.ibanSwift = ibanSwift?.trim() || null;
  }

  return payload;
}
