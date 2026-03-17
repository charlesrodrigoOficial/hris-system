import type {
  CompanyDocumentCategory,
  EmployeeDocumentCategory,
} from "@prisma/client";

export type DocumentCategory = "MY_DOCUMENT" | "COMPANY_DOCUMENT";

export type EmployeeDocumentRecord = {
  id: string;
  title: string;
  category: EmployeeDocumentCategory;
  fileName: string;
  fileUrl: string;
  sourceLabel: string | null;
  uploadedBy: string | null;
  createdAt: Date;
};

export type CompanyDocumentRecord = {
  id: string;
  title: string;
  category: CompanyDocumentCategory;
  fileName: string;
  fileUrl: string;
  sourceLabel: string | null;
  uploadedBy: string | null;
  createdAt: Date;
};

export type DocumentItem = {
  id: string;
  name: string;
  category: DocumentCategory;
  categoryLabel: string;
  uploadedBy: string;
  uploadedAt: string;
  sourceLabel: string;
  fileUrl: string;
};

const EMPLOYEE_DOCUMENT_LABELS: Record<EmployeeDocumentCategory, string> = {
  EDUCATION: "Education",
  EMPLOYMENT: "Employment",
  WORK_ELIGIBILITY: "Work Eligibility",
  PERSONAL: "Personal Doc",
};

const COMPANY_DOCUMENT_LABELS: Record<CompanyDocumentCategory, string> = {
  EMPLOYMENT_LETTER: "Employment Letter",
  CONTRACT: "Contract",
  HANDBOOK: "Handbook",
  HR_POLICY: "HR Policy",
  GUIDE: "Guide",
};

function formatDocumentDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function mapEmployeeDocumentToItem(
  document: EmployeeDocumentRecord,
): DocumentItem {
  return {
    id: document.id,
    name: document.title || document.fileName,
    category: "MY_DOCUMENT",
    categoryLabel: EMPLOYEE_DOCUMENT_LABELS[document.category],
    uploadedBy: document.uploadedBy?.trim() || "HR",
    uploadedAt: formatDocumentDate(document.createdAt),
    sourceLabel: document.sourceLabel?.trim() || "Onboarding",
    fileUrl: document.fileUrl,
  };
}

export function mapCompanyDocumentToItem(
  document: CompanyDocumentRecord,
): DocumentItem {
  return {
    id: document.id,
    name: document.title || document.fileName,
    category: "COMPANY_DOCUMENT",
    categoryLabel: COMPANY_DOCUMENT_LABELS[document.category],
    uploadedBy: document.uploadedBy?.trim() || "HR",
    uploadedAt: formatDocumentDate(document.createdAt),
    sourceLabel: document.sourceLabel?.trim() || "HR Library",
    fileUrl: document.fileUrl,
  };
}
