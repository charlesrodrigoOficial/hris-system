"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CLAIM_PURPOSE_OPTIONS,
  claimPurposeLabel,
  LEAVE_TYPE_OPTIONS,
  leaveTypeLabel,
  SUPPORT_REQUEST_OPTIONS,
  supportRequestLabel,
} from "@/lib/requests/helpers";
import type {
  ClaimPurpose,
  LeaveRequestType,
  RequestFormContext,
  RequestType,
  SupportRequestType,
} from "@/lib/requests/types";

type Props = {
  requester: RequestFormContext;
  allowedTypes?: RequestType[];
  type: RequestType;
  setType: (value: RequestType) => void;
  supportRequestType: SupportRequestType | "";
  setSupportRequestType: (value: SupportRequestType | "") => void;
  supportRequestTypeOther: string;
  setSupportRequestTypeOther: (value: string) => void;
  expectedCompletionDate: string;
  setExpectedCompletionDate: (value: string) => void;
  supportAdditionalNotes: string;
  setSupportAdditionalNotes: (value: string) => void;
  leaveType: LeaveRequestType | "";
  setLeaveType: (value: LeaveRequestType | "") => void;
  claimPurpose: ClaimPurpose | "";
  setClaimPurpose: (value: ClaimPurpose | "") => void;
  claimPurposeOther: string;
  setClaimPurposeOther: (value: string) => void;
  managerId: string;
  setManagerId: (value: string) => void;
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  expenseDate: string;
  setExpenseDate: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  currency: string;
  setCurrency: (value: string) => void;
  bankName: string;
  setBankName: (value: string) => void;
  accountNumber: string;
  setAccountNumber: (value: string) => void;
  ibanSwift: string;
  setIbanSwift: (value: string) => void;
  receiptDocument: File | null;
  setReceiptDocument: (value: File | null) => void;
  supportingDocument: File | null;
  setSupportingDocument: (value: File | null) => void;
  error: string | null;
};

function RequesterSnapshot({ requester }: { requester: RequestFormContext }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input className="rounded-xl" value={requester.fullName} readOnly />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input className="rounded-xl" value={requester.email} disabled />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Position</Label>
        <Input className="rounded-xl" value={requester.position} readOnly />
      </div>
    </>
  );
}

export default function RequestFormFields({
  requester,
  allowedTypes = ["SUPPORT", "LEAVE", "CLAIM"],
  type,
  setType,
  supportRequestType,
  setSupportRequestType,
  supportRequestTypeOther,
  setSupportRequestTypeOther,
  expectedCompletionDate,
  setExpectedCompletionDate,
  supportAdditionalNotes,
  setSupportAdditionalNotes,
  leaveType,
  setLeaveType,
  claimPurpose,
  setClaimPurpose,
  claimPurposeOther,
  setClaimPurposeOther,
  managerId,
  setManagerId,
  title,
  setTitle,
  description,
  setDescription,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  expenseDate,
  setExpenseDate,
  amount,
  setAmount,
  currency,
  bankName,
  setBankName,
  accountNumber,
  setAccountNumber,
  ibanSwift,
  setIbanSwift,
  receiptDocument,
  setReceiptDocument,
  supportingDocument,
  setSupportingDocument,
  error,
}: Props) {
  const showTypePicker = allowedTypes.length > 1;
  const managers = Array.from(
    new Map(
      requester.managers
        .filter((manager) => manager?.id)
        .map((manager) => [manager.id, manager]),
    ).values(),
  );

  return (
    <div className="space-y-4">
      {showTypePicker ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Request Type</p>
          <Select
            value={type}
            onValueChange={(value) => setType(value as RequestType)}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {allowedTypes.includes("SUPPORT") && (
                <SelectItem value="SUPPORT">Support</SelectItem>
              )}
              {allowedTypes.includes("LEAVE") && (
                <SelectItem value="LEAVE">Leave</SelectItem>
              )}
              {allowedTypes.includes("CLAIM") && (
                <SelectItem value="CLAIM">Claim / Reimbursement</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">Request Type</p>
          <Input
            className="rounded-xl"
            value={type === "LEAVE" ? "Leave" : type}
            readOnly
          />
        </div>
      )}

      {type === "SUPPORT" && (
        <div className="space-y-4 rounded-2xl border p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Your Full Name</Label>
              <Input className="rounded-xl" value={requester.fullName} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Your Position</Label>
              <Input className="rounded-xl" value={requester.position} readOnly />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type of Request</Label>
            <Select
              value={supportRequestType}
              onValueChange={(value) =>
                setSupportRequestType(value as SupportRequestType)
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select support request type" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORT_REQUEST_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {supportRequestType && (
              <p className="text-xs text-muted-foreground">
                Selected: {supportRequestLabel(supportRequestType)}
              </p>
            )}
          </div>

          {supportRequestType === "OTHER" && (
            <div className="space-y-2">
              <Label>Other Request Type</Label>
              <Input
                className="rounded-xl"
                placeholder="Specify the request type"
                value={supportRequestTypeOther}
                onChange={(e) => setSupportRequestTypeOther(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Purpose of Request</Label>
            <Textarea
              className="min-h-[120px] rounded-xl"
              placeholder="Your answer"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Expected Completion Date</Label>
            <Input
              className="rounded-xl"
              type="date"
              value={expectedCompletionDate}
              onChange={(e) => setExpectedCompletionDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Additional Notes/Special Request</Label>
            <Textarea
              className="min-h-[120px] rounded-xl"
              placeholder="Your answer"
              value={supportAdditionalNotes}
              onChange={(e) => setSupportAdditionalNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Supporting Document (Optional)</Label>
            <Input
              className="rounded-xl"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) =>
                setSupportingDocument(e.target.files?.[0] ?? null)
              }
            />
            <p className="text-xs text-muted-foreground">
              Upload any related document or screenshot for this support request.
            </p>
            {supportingDocument && (
              <p className="text-xs text-muted-foreground">
                Selected file: {supportingDocument.name}
              </p>
            )}
          </div>
        </div>
      )}

      {type === "LEAVE" && (
        <div className="space-y-4 rounded-2xl border p-4">
          <RequesterSnapshot requester={requester} />

          <div className="space-y-2">
            <Label>Type of Leave</Label>
            <Select
              value={leaveType}
              onValueChange={(value) => setLeaveType(value as LeaveRequestType)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {leaveType && (
              <p className="text-xs text-muted-foreground">
                Selected: {leaveTypeLabel(leaveType)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input
                className="rounded-xl"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input
                className="rounded-xl"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              className="min-h-[120px] rounded-xl"
              placeholder="Reason for leave, handover notes, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Manager's Name</Label>
            <Select
              value={managerId}
              onValueChange={setManagerId}
              disabled={managers.length === 0}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue
                  placeholder={
                    managers.length === 0
                      ? "No department managers found"
                      : "Select manager"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Supporting Document (Optional)</Label>
            <Input
              className="rounded-xl"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) =>
                setSupportingDocument(e.target.files?.[0] ?? null)
              }
            />
            <p className="text-xs text-muted-foreground">
              Upload your manager approval email/chat screenshot if available.
            </p>
            {supportingDocument && (
              <p className="text-xs text-muted-foreground">
                Selected file: {supportingDocument.name}
              </p>
            )}
          </div>
        </div>
      )}

      {type === "CLAIM" && (
        <div className="space-y-4 rounded-2xl border p-4">
          <RequesterSnapshot requester={requester} />

          <div className="space-y-2">
            <Label>Purpose of the claim</Label>
            <Select
              value={claimPurpose}
              onValueChange={(value) => setClaimPurpose(value as ClaimPurpose)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select claim purpose" />
              </SelectTrigger>
              <SelectContent>
                {CLAIM_PURPOSE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {claimPurpose && (
              <p className="text-xs text-muted-foreground">
                Selected: {claimPurposeLabel(claimPurpose)}
              </p>
            )}
          </div>

          {claimPurpose === "OTHER" && (
            <div className="space-y-2">
              <Label>Other purpose</Label>
              <Input
                className="rounded-xl"
                placeholder="Describe the purpose of this claim"
                value={claimPurposeOther}
                onChange={(e) => setClaimPurposeOther(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Date of Expense</Label>
            <Input
              className="rounded-xl"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If the expenses are from different dates, input the first date of
              your expense.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Amount (in local currency)</Label>
            <Input
              className="rounded-xl"
              type="number"
              inputMode="decimal"
              placeholder={`Amount in ${currency}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Local currency: {currency}
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border p-4">
            <div className="text-sm font-medium">Bank details</div>
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                className="rounded-xl"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                className="rounded-xl"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>IBAN/SWIFT</Label>
              <Input
                className="rounded-xl"
                value={ibanSwift}
                onChange={(e) => setIbanSwift(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Upload Receipt or Proof of Payment</Label>
            <Input
              className="rounded-xl"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setReceiptDocument(e.target.files?.[0] ?? null)}
            />
            {receiptDocument && (
              <p className="text-xs text-muted-foreground">
                Selected file: {receiptDocument.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Manager's Name</Label>
            <Select
              value={managerId}
              onValueChange={setManagerId}
              disabled={managers.length === 0}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue
                  placeholder={
                    managers.length === 0
                      ? "No department managers found"
                      : "Select manager"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Supporting Document</Label>
            <Input
              className="rounded-xl"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) =>
                setSupportingDocument(e.target.files?.[0] ?? null)
              }
            />
            <p className="text-xs text-muted-foreground">
              Upload the email or chat screenshot that includes your manager's
              acceptance.
            </p>
            {supportingDocument && (
              <p className="text-xs text-muted-foreground">
                Selected file: {supportingDocument.name}
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
