export type RequestType = "SUPPORT" | "LEAVE" | "CLAIM";
export type RequestStatus = "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";
export type SupportRequestType =
  | "RECOMMENDATION_LETTER"
  | "EMPLOYMENT_VERIFICATION"
  | "PROOF_OF_INCOME"
  | "CONTRACT_COPY"
  | "OPERATIONAL_REQUEST"
  | "OTHER";
export type LeaveRequestType =
  | "PAID_VACATION_LEAVE"
  | "SICK_LEAVE"
  | "URGENT_LEAVE"
  | "MATERNITY_LEAVE"
  | "PATERNITY_LEAVE"
  | "BEREAVEMENT_LEAVE"
  | "UNPAID_LEAVE"
  | "MENTAL_WELLNESS_DAY";
export type ClaimPurpose =
  | "TEAM_MEAL_OR_COFFEE"
  | "EMPLOYEE_ENGAGEMENT_WINNER"
  | "BEST_EMPLOYEE_RECOGNITION"
  | "BIRTHDAY_VOUCHER"
  | "TRANSPORT"
  | "OFFICE_SUPPLIES"
  | "TRAINING_CERTIFICATION_COURSES"
  | "OTHER";
export type RequestAttachmentType =
  | "GENERAL"
  | "MANAGER_APPROVAL"
  | "CLAIM_RECEIPT";

export type RequestRow = {
  id: string;
  type: RequestType;
  title: string;
  description: string | null;
  status: RequestStatus;
  createdAt: string;

  supportRequestType?: SupportRequestType | null;
  supportRequestTypeOther?: string | null;
  expectedCompletionDate?: string | null;
  supportAdditionalNotes?: string | null;
  leaveType?: LeaveRequestType | null;
  claimPurpose?: ClaimPurpose | null;
  claimPurposeOther?: string | null;
  expenseDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  managerEmployeeId?: string | null;
  managerEmployee?: {
    id: string;
    fullName: string;
  } | null;
  amount?: string | number | null;
  currency?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ibanSwift?: string | null;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    attachmentType: RequestAttachmentType;
  }>;
};

export type CreateRequestPayload = {
  type: RequestType;
  title: string;
  description: string | null;

  supportRequestType?: SupportRequestType | null;
  supportRequestTypeOther?: string | null;
  expectedCompletionDate?: string | null;
  supportAdditionalNotes?: string | null;
  leaveType?: LeaveRequestType | null;
  claimPurpose?: ClaimPurpose | null;
  claimPurposeOther?: string | null;
  expenseDate?: string | null;
  managerEmployeeId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ibanSwift?: string | null;
  amount?: number | null;
  currency?: string | null;
  receiptDocument?: File | null;
  supportingDocument?: File | null;
};

export type RequestFormManager = {
  id: string;
  name: string;
};

export type RequestFormContext = {
  fullName: string;
  email: string;
  position: string;
  currency: string;
  managers: RequestFormManager[];
};

export type AdminRequestRow = {
  id: string
  title: string
  description: string | null
  type: RequestType
  status: RequestStatus
  createdAt: string
  supportRequestType?: SupportRequestType | null
  supportRequestTypeOther?: string | null
  expectedCompletionDate?: string | null
  supportAdditionalNotes?: string | null
  leaveType?: LeaveRequestType | null
  claimPurpose?: ClaimPurpose | null
  claimPurposeOther?: string | null
  expenseDate?: string | null
  managerEmployee?: {
    id: string
    fullName: string
  } | null
  bankName?: string | null
  accountNumber?: string | null
  ibanSwift?: string | null
  attachments?: Array<{
    id: string
    fileName: string
    fileUrl: string
    attachmentType: RequestAttachmentType
  }>

  user: {
    name: string | null
    email: string | null
  }
}
