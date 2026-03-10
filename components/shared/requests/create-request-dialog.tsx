"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import type {
  ClaimPurpose,
  LeaveRequestType,
  RequestFormContext,
  SupportRequestType,
  RequestType,
} from "@/lib/requests/types";
import RequestFormFields from "./requests-form-fields";

type Props = {
  requester: RequestFormContext;
  open: boolean;
  setOpen: (open: boolean) => void;
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
  submitting: boolean;
  onSubmit: () => void;
  onReset: () => void;
};

export default function CreateRequestDialog(props: Props) {
  const {
    requester,
    open,
    setOpen,
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
    setCurrency,
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
    submitting,
    onSubmit,
    onReset,
  } = props;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) onReset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="blueGradiant" className="rounded-xl text-white">
          Create Request
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Create a request</DialogTitle>
          <DialogDescription>
            Choose a request type and provide the details.
          </DialogDescription>
        </DialogHeader>

        <RequestFormFields
          requester={requester}
          type={type}
          setType={setType}
          supportRequestType={supportRequestType}
          setSupportRequestType={setSupportRequestType}
          supportRequestTypeOther={supportRequestTypeOther}
          setSupportRequestTypeOther={setSupportRequestTypeOther}
          expectedCompletionDate={expectedCompletionDate}
          setExpectedCompletionDate={setExpectedCompletionDate}
          supportAdditionalNotes={supportAdditionalNotes}
          setSupportAdditionalNotes={setSupportAdditionalNotes}
          leaveType={leaveType}
          setLeaveType={setLeaveType}
          claimPurpose={claimPurpose}
          setClaimPurpose={setClaimPurpose}
          claimPurposeOther={claimPurposeOther}
          setClaimPurposeOther={setClaimPurposeOther}
          managerId={managerId}
          setManagerId={setManagerId}
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          expenseDate={expenseDate}
          setExpenseDate={setExpenseDate}
          amount={amount}
          setAmount={setAmount}
          currency={currency}
          setCurrency={setCurrency}
          bankName={bankName}
          setBankName={setBankName}
          accountNumber={accountNumber}
          setAccountNumber={setAccountNumber}
          ibanSwift={ibanSwift}
          setIbanSwift={setIbanSwift}
          receiptDocument={receiptDocument}
          setReceiptDocument={setReceiptDocument}
          supportingDocument={supportingDocument}
          setSupportingDocument={setSupportingDocument}
          error={error}
        />

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
