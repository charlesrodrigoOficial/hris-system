"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { AdminRequestRow, RequestStatus } from "@/lib/requests/types";
import {
  STATUS_META,
  claimPurposeLabel,
  formatDate,
  leaveTypeLabel,
  supportRequestLabel,
  typeLabel,
} from "@/lib/requests/helpers";

type RequestGroup = "pending" | "approved" | "rejected";

function requestGroupFromStatus(status: RequestStatus): RequestGroup {
  if (status === "APPROVED") return "approved";
  if (status === "REJECTED") return "rejected";
  return "pending";
}

function requestGroupTitle(group: RequestGroup) {
  if (group === "approved") return "Approved Requests";
  if (group === "rejected") return "Rejected Requests";
  return "Pending Requests";
}

function requestGroupRank(group: RequestGroup) {
  if (group === "pending") return 0;
  if (group === "approved") return 1;
  return 2;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm break-words">{value}</div>
    </div>
  );
}

function formatAmount(params: {
  amount?: string | number | null;
  currency?: string | null;
}) {
  const { amount, currency } = params;
  if (amount === null || amount === undefined || amount === "") return null;

  const numeric = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(numeric)) {
    return `${currency ?? ""} ${String(amount)}`.trim();
  }

  if (!currency) {
    return new Intl.NumberFormat("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  }

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    }).format(numeric);
  } catch {
    return `${currency} ${numeric.toFixed(2)}`;
  }
}

function dateOnlyUtcMs(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function inclusiveDays(startIso?: string | null, endIso?: string | null) {
  if (!startIso || !endIso) return null;
  const start = dateOnlyUtcMs(startIso);
  const end = dateOnlyUtcMs(endIso);
  if (start === null || end === null) return null;

  const diffDays = Math.round((end - start) / 86_400_000) + 1;
  return diffDays > 0 ? diffDays : null;
}

function attachmentTypeLabel(
  type: NonNullable<AdminRequestRow["attachments"]>[number]["attachmentType"],
) {
  if (type === "CLAIM_RECEIPT") return "Proof of payment";
  if (type === "MANAGER_APPROVAL") return "Supporting document";
  return "Uploaded file";
}

function AttachmentsSection({
  attachments,
}: {
  attachments: AdminRequestRow["attachments"];
}) {
  if (!attachments || attachments.length === 0) return null;

  const uploadedFiles = attachments.filter((a) => a.attachmentType === "GENERAL");
  const proofOfPayment = attachments.filter(
    (a) => a.attachmentType === "CLAIM_RECEIPT",
  );
  const supportingDocuments = attachments.filter(
    (a) => a.attachmentType === "MANAGER_APPROVAL",
  );

  const groups: Array<{
    title: string;
    items: NonNullable<AdminRequestRow["attachments"]>;
  }> = [
    { title: "Uploaded files", items: uploadedFiles },
    { title: "Proof of payment", items: proofOfPayment },
    { title: "Supporting documents", items: supportingDocuments },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="mt-4 rounded-md border bg-muted/10 p-3">
      <p className="text-sm font-medium">Attachments</p>

      <div className="mt-3 space-y-4">
        {groups.map((group) => (
          <div key={group.title} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {group.title}
            </p>

            <div className="space-y-2">
              {group.items.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium break-words">{a.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {attachmentTypeLabel(a.attachmentType)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={a.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`View ${a.fileName}`}
                      >
                        View
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={a.fileUrl}
                        download
                        aria-label={`Download ${a.fileName}`}
                      >
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminRequestsPage() {
  const searchParams = useSearchParams();
  const focusRequestId = searchParams.get("focus");
  const [rows, setRows] = React.useState<AdminRequestRow[]>([]);
  const [actorRole, setActorRole] = React.useState<string | null>(null);
  const [hasFocused, setHasFocused] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() =>
    focusRequestId ? { [focusRequestId]: true } : {},
  );
  const [reviewDialog, setReviewDialog] = React.useState<{
    id: string;
    status: RequestStatus;
    label: string;
  } | null>(null);
  const [reviewNote, setReviewNote] = React.useState("");
  const [approvalDocument, setApprovalDocument] = React.useState<File | null>(
    null,
  );

  const [companyDocDialogOpen, setCompanyDocDialogOpen] =
    React.useState(false);
  const [companyDocTitle, setCompanyDocTitle] = React.useState("");
  const [companyDocCategory, setCompanyDocCategory] = React.useState("GUIDE");
  const [companyDocFile, setCompanyDocFile] = React.useState<File | null>(null);
  const [companyDocError, setCompanyDocError] = React.useState<string | null>(
    null,
  );
  const [companyDocUploading, setCompanyDocUploading] = React.useState(false);

  const canUploadCompanyDocs = actorRole === "ADMIN" || actorRole === "HR";

  async function load() {
    const res = await fetch("/api/admin/requests", { cache: "no-store" });
    const data = (await res.json()) as AdminRequestRow[];
    setRows(data);
  }

  React.useEffect(() => {
    load();
  }, []);

  React.useEffect(() => {
    async function loadActor() {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { role?: string | null };
      const role = typeof data?.role === "string" ? data.role.trim() : "";
      setActorRole(role ? role.toUpperCase() : null);
    }

    loadActor();
  }, []);

  React.useEffect(() => {
    if (!focusRequestId || hasFocused || rows.length === 0) return;

    const el = document.getElementById(`admin-request-row-${focusRequestId}`);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHasFocused(true);
  }, [focusRequestId, hasFocused, rows]);

  React.useEffect(() => {
    if (!focusRequestId) return;
    setExpanded((prev) => ({ ...prev, [focusRequestId]: true }));
  }, [focusRequestId]);

  async function updateStatus(params: {
    id: string;
    status: RequestStatus;
    note?: string;
    approvalDocument?: File | null;
  }) {
    const { id, status, note, approvalDocument } = params;

    if (approvalDocument) {
      const fd = new FormData();
      fd.set("status", status);
      if (note) fd.set("note", note);
      fd.set("approvalDocument", approvalDocument);

      await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        body: fd,
      });
    } else {
      await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
    }

    load();
  }

  async function uploadCompanyDocument() {
    setCompanyDocError(null);

    if (!companyDocFile) {
      setCompanyDocError("Please select a file to upload.");
      return;
    }

    setCompanyDocUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", companyDocFile);
      fd.set("category", companyDocCategory);
      if (companyDocTitle.trim()) fd.set("title", companyDocTitle.trim());

      const res = await fetch("/api/admin/company-documents", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as any;
        setCompanyDocError(
          payload?.error || "Failed to upload company document.",
        );
        return;
      }

      setCompanyDocDialogOpen(false);
      setCompanyDocTitle("");
      setCompanyDocCategory("GUIDE");
      setCompanyDocFile(null);
      setCompanyDocError(null);
    } finally {
      setCompanyDocUploading(false);
    }
  }

  const groupCounts = React.useMemo(() => {
    return rows.reduce<Record<RequestGroup, number>>(
      (acc, r) => {
        const group = requestGroupFromStatus(r.status);
        acc[group] += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 },
    );
  }, [rows]);

  const sortedRows = React.useMemo(() => {
    return [...rows].sort((a, b) => {
      const ag = requestGroupFromStatus(a.status);
      const bg = requestGroupFromStatus(b.status);
      const groupDiff = requestGroupRank(ag) - requestGroupRank(bg);
      if (groupDiff !== 0) return groupDiff;

      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [rows]);

  return (
    <div className="p-6 space-y-6">
      <Dialog
        open={companyDocDialogOpen}
        onOpenChange={(open) => {
          setCompanyDocDialogOpen(open);
          if (!open) {
            setCompanyDocTitle("");
            setCompanyDocCategory("GUIDE");
            setCompanyDocFile(null);
            setCompanyDocError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload company document</DialogTitle>
            <DialogDescription>
              Only HR Manager and Super Admin can upload company documents.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Title (optional)</p>
              <Input
                value={companyDocTitle}
                onChange={(e) => setCompanyDocTitle(e.target.value)}
                placeholder="e.g. Employee handbook 2026"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Category</p>
              <Select value={companyDocCategory} onValueChange={setCompanyDocCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYMENT_LETTER">Employment letter</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="HANDBOOK">Handbook</SelectItem>
                  <SelectItem value="HR_POLICY">HR policy</SelectItem>
                  <SelectItem value="GUIDE">Guide</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">File</p>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setCompanyDocFile(e.target.files?.[0] ?? null)}
              />
              {companyDocFile ? (
                <p className="text-xs text-muted-foreground">
                  Selected file: {companyDocFile.name}
                </p>
              ) : null}
            </div>

            {companyDocError ? (
              <p className="text-sm text-red-600">{companyDocError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompanyDocDialogOpen(false)}
              disabled={companyDocUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={uploadCompanyDocument}
              disabled={!canUploadCompanyDocs || companyDocUploading}
              title={
                canUploadCompanyDocs
                  ? undefined
                  : "Only HR Manager and Super Admin can upload."
              }
            >
              {companyDocUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(reviewDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewDialog(null);
            setReviewNote("");
            setApprovalDocument(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog?.status === "REJECTED" ? "Reject" : "Approve"} request
            </DialogTitle>
            <DialogDescription>
              {reviewDialog?.status === "REJECTED"
                ? "Add a rejection reason (required)."
                : "Add an admin note (optional). This will be visible in the audit trail."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-sm font-medium">{reviewDialog?.label ?? ""}</p>
            <Textarea
              className="min-h-[120px]"
              placeholder={
                reviewDialog?.status === "REJECTED"
                  ? "Why is this request being rejected?"
                  : "Optional note for this approval..."
              }
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
          </div>

          {reviewDialog?.status !== "REJECTED" ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Approval document (optional)</p>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) =>
                  setApprovalDocument(e.target.files?.[0] ?? null)
                }
              />
              {approvalDocument ? (
                <p className="text-xs text-muted-foreground">
                  Selected file: {approvalDocument.name}
                </p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialog(null);
                setReviewNote("");
                setApprovalDocument(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={reviewDialog?.status === "REJECTED" ? "destructive" : "default"}
              disabled={
                !reviewDialog ||
                (reviewDialog.status === "REJECTED" && !reviewNote.trim())
              }
              onClick={async () => {
                if (!reviewDialog) return;
                const trimmed = reviewNote.trim();
                const note = trimmed ? trimmed : undefined;
                await updateStatus({
                  id: reviewDialog.id,
                  status: reviewDialog.status,
                  note,
                  approvalDocument,
                });
                setReviewDialog(null);
                setReviewNote("");
                setApprovalDocument(null);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Requests</CardTitle>
          <Button
            size="sm"
            variant="outline"
            disabled={!canUploadCompanyDocs}
            onClick={() => setCompanyDocDialogOpen(true)}
            title={
              canUploadCompanyDocs
                ? undefined
                : "Only HR Manager and Super Admin can upload."
            }
          >
            Upload company doc
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {sortedRows.length === 0 ? (
            <div className="rounded-xl border bg-muted/10 p-4 text-sm text-muted-foreground">
              No requests yet.
            </div>
          ) : (
            sortedRows.map((r, idx) => {
              const group = requestGroupFromStatus(r.status);
              const showGroupHeader =
                idx === 0 ||
                requestGroupFromStatus(sortedRows[idx - 1]!.status) !== group;
            const meta = STATUS_META[r.status];
            const isFocused = Boolean(focusRequestId && r.id === focusRequestId);
            const isFinal = r.status === "APPROVED" || r.status === "REJECTED";
            const isExpanded = Boolean(expanded[r.id]);
            const reviewActivity = isFinal
              ? (r.activities ?? []).find((a) => a.toStatus === r.status) ??
                (r.activities ?? [])[0] ??
                null
              : null;
            const reviewedBy =
              reviewActivity?.actor.fullName?.trim() ||
              reviewActivity?.actor.name?.trim() ||
              reviewActivity?.actor.email?.trim() ||
              null;
            const employeeName =
              r.user.fullName?.trim() ||
              r.user.name?.trim() ||
              "Unknown employee";
            const employeeEmail = r.user.email?.trim() || "—";
            const departmentName =
              r.user.department?.departmentName?.trim() || null;
            const position = r.user.position?.trim() || null;
            const departmentPosition =
              [departmentName, position].filter(Boolean).join(" / ") || "—";

            const subtypeLabel =
              r.type === "LEAVE" && r.leaveType
                ? leaveTypeLabel(r.leaveType)
                : r.type === "CLAIM" && r.claimPurpose
                  ? claimPurposeLabel(r.claimPurpose)
                  : r.type === "SUPPORT" && r.supportRequestType
                    ? supportRequestLabel(r.supportRequestType)
                    : null;
            const trimmedTitle = r.title?.trim() || "";
            const primaryTitle = subtypeLabel || trimmedTitle || typeLabel(r.type);
            const secondaryTitle = subtypeLabel
              ? trimmedTitle && trimmedTitle !== subtypeLabel
                ? trimmedTitle
                : typeLabel(r.type)
              : trimmedTitle
                ? typeLabel(r.type)
                : null;

            const submittedDate = formatDate(r.createdAt);

            const leaveDays = inclusiveDays(r.startDate, r.endDate);
            const leaveRange =
              r.startDate && r.endDate
                ? `${formatDate(r.startDate)} → ${formatDate(r.endDate)}`
                : r.startDate
                  ? `From ${formatDate(r.startDate)}`
                  : r.endDate
                    ? `Until ${formatDate(r.endDate)}`
                    : null;

            const periodLabel =
              r.type === "LEAVE"
                ? "Request period"
                : r.type === "CLAIM"
                  ? "Expense date"
                  : "Effective date";
            const periodValue =
              r.type === "LEAVE"
                ? leaveRange
                : r.type === "CLAIM"
                  ? r.expenseDate
                    ? formatDate(r.expenseDate)
                    : null
                  : r.expectedCompletionDate
                    ? formatDate(r.expectedCompletionDate)
                    : null;
            const claimAmountLabel =
              r.type === "CLAIM"
                ? formatAmount({ amount: r.amount, currency: r.currency })
                : null;

              return (
                <React.Fragment key={r.id}>
                  {showGroupHeader && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm font-medium">
                        {requestGroupTitle(group)}
                      </p>
                      <Badge variant="secondary">{groupCounts[group]}</Badge>
                    </div>
                  )}

                  <div
                    id={`admin-request-row-${r.id}`}
                    className={`rounded-xl border p-4 ${isFocused ? "bg-blue-50/60 ring-1 ring-blue-200" : ""}`}
                  >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="space-y-1">
                      <p className="font-medium">{primaryTitle}</p>
                      {secondaryTitle && (
                        <p className="text-sm text-muted-foreground">
                          {secondaryTitle}
                        </p>
                      )}
                      {!isExpanded && (
                        <div className="mt-2 space-y-2">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium line-clamp-1">
                              {employeeName}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {employeeEmail}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              <span className="font-medium text-foreground">
                                Department:
                              </span>{" "}
                              {departmentName ?? "—"}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              <span className="font-medium text-foreground">
                                Submitted:
                              </span>{" "}
                              {submittedDate}
                            </p>

                            {r.type === "CLAIM" && claimAmountLabel && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                <span className="font-medium text-foreground">
                                  Amount:
                                </span>{" "}
                                {claimAmountLabel}
                              </p>
                            )}

                            {r.type === "LEAVE" && leaveRange && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                <span className="font-medium text-foreground">
                                  Period:
                                </span>{" "}
                                {leaveRange}
                              </p>
                            )}

                            {r.type === "SUPPORT" && periodValue && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                <span className="font-medium text-foreground">
                                  Effective:
                                </span>{" "}
                                {periodValue}
                              </p>
                            )}

                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  Status:
                                </span>
                              </span>
                              <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                            </div>
                          </div>

                          {r.description?.trim() && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              <span className="font-medium text-foreground">
                                Reason:
                              </span>{" "}
                              {r.description.trim()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="Employee name" value={employeeName} />
                        <Field label="Employee email" value={employeeEmail} />
                        <Field
                          label="Department / position"
                          value={departmentPosition}
                        />
                        <Field label="Submitted date" value={submittedDate} />
                        <Field
                          label={periodLabel}
                          value={
                            periodValue ? (
                              <span>
                                {periodValue}
                                {r.type === "LEAVE" && leaveDays
                                  ? ` (${leaveDays} day${leaveDays === 1 ? "" : "s"})`
                                  : ""}
                              </span>
                            ) : (
                              "—"
                            )
                          }
                        />
                        <Field
                          label="Current status"
                          value={
                            <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                          }
                        />
                        <Field
                          label="Short summary / reason"
                          value={r.description?.trim() ? r.description : "—"}
                        />
                        {isFinal && (
                          <>
                            <Field label="Reviewed by" value={reviewedBy ?? "—"} />
                            <Field
                              label="Reviewed on"
                              value={
                                reviewActivity?.createdAt
                                  ? formatDate(reviewActivity.createdAt)
                                  : "—"
                              }
                            />
                            <Field
                              label="Admin note / rejection reason"
                              value={reviewActivity?.note?.trim() || "—"}
                            />
                          </>
                        )}
                      </div>
                    )}

                    {isExpanded && r.type === "LEAVE" && (
                      <div className="mt-4 rounded-md border bg-muted/10 p-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <Field
                            label="Leave type"
                            value={r.leaveType ? leaveTypeLabel(r.leaveType) : "—"}
                          />
                          <Field label="From date → to date" value={leaveRange ?? "—"} />
                          <Field
                            label="Total days"
                            value={leaveDays ? `${leaveDays}` : "—"}
                          />
                          <Field label="Reason" value={r.description?.trim() || "—"} />
                          <Field
                            label="Manager"
                            value={r.managerEmployee?.fullName?.trim() || "—"}
                          />
                        </div>
                      </div>
                    )}

                    {isExpanded && r.type === "CLAIM" && (
                      <div className="mt-4 rounded-md border bg-muted/10 p-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <Field
                            label="Request purpose"
                            value={
                              r.claimPurpose ? claimPurposeLabel(r.claimPurpose) : "—"
                            }
                          />
                          <Field
                            label="Amount"
                            value={
                              formatAmount({ amount: r.amount, currency: r.currency }) ??
                              "—"
                            }
                          />
                          <Field
                            label="Bank account / payout method"
                            value={
                              r.bankName || r.accountNumber || r.ibanSwift ? (
                                <div className="space-y-1">
                                  <p className="text-sm">Bank transfer</p>
                                  <p className="text-sm text-muted-foreground">
                                    {[r.bankName, r.accountNumber, r.ibanSwift]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </p>
                                </div>
                              ) : (
                                "—"
                              )
                            }
                          />
                          <Field
                            label="Note/message"
                            value={r.description?.trim() ? r.description : "—"}
                          />
                        </div>
                      </div>
                    )}

                    {isExpanded && r.type === "SUPPORT" && (
                      <div className="mt-4 rounded-md border bg-muted/10 p-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <Field
                            label="Request type"
                            value={
                              r.supportRequestType
                                ? supportRequestLabel(r.supportRequestType)
                                : "—"
                            }
                          />
                          <Field
                            label="Effective date"
                            value={
                              r.expectedCompletionDate
                                ? formatDate(r.expectedCompletionDate)
                                : "—"
                            }
                          />
                          <Field
                            label="Short summary / reason"
                            value={r.description?.trim() ? r.description : "—"}
                          />
                        </div>
                      </div>
                    )}

                    {isExpanded && <AttachmentsSection attachments={r.attachments} />}
                  </div>

                  <div className="flex items-center gap-3 sm:justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [r.id]: !isExpanded }))
                      }
                    >
                      {isExpanded ? "Minimize" : "Details"}
                    </Button>

                    <Button
                      size="sm"
                      disabled={isFinal}
                      onClick={() => {
                        setExpanded((prev) => ({ ...prev, [r.id]: true }));
                        setReviewDialog({
                          id: r.id,
                          status: "APPROVED",
                          label: `${typeLabel(r.type)}${subtypeLabel ? ` — ${subtypeLabel}` : ""}`,
                        });
                        setReviewNote("");
                      }}
                    >
                      Approve
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isFinal}
                      onClick={() => {
                        setExpanded((prev) => ({ ...prev, [r.id]: true }));
                        setReviewDialog({
                          id: r.id,
                          status: "REJECTED",
                          label: `${typeLabel(r.type)}${subtypeLabel ? ` — ${subtypeLabel}` : ""}`,
                        });
                        setReviewNote("");
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
                </React.Fragment>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
