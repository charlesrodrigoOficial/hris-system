"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  ClaimPurpose,
  LeaveRequestType,
  RequestFormContext,
  RequestRow,
  SupportRequestType,
  RequestType,
} from "@/lib/requests/types";
import { fetchRequests, createRequest } from "@/lib/requests/clients";
import { validateRequest, buildPayload } from "@/lib/requests/helpers";
import CreateRequestDialog from "./create-request-dialog";
import RequestList from "./request-list";

type Props = {
  requester: RequestFormContext;
};

export default function RequestsPageClient({ requester }: Props) {
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState<RequestRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const [type, setType] = React.useState<RequestType>("SUPPORT");
  const [supportRequestType, setSupportRequestType] = React.useState<
    SupportRequestType | ""
  >("");
  const [supportRequestTypeOther, setSupportRequestTypeOther] =
    React.useState("");
  const [expectedCompletionDate, setExpectedCompletionDate] =
    React.useState("");
  const [supportAdditionalNotes, setSupportAdditionalNotes] =
    React.useState("");
  const [leaveType, setLeaveType] = React.useState<LeaveRequestType | "">("");
  const [claimPurpose, setClaimPurpose] = React.useState<ClaimPurpose | "">("");
  const [claimPurposeOther, setClaimPurposeOther] = React.useState("");
  const [managerId, setManagerId] = React.useState(
    requester.managers[0]?.id ?? "",
  );
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [expenseDate, setExpenseDate] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState(requester.currency);
  const [bankName, setBankName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [ibanSwift, setIbanSwift] = React.useState("");
  const [receiptDocument, setReceiptDocument] = React.useState<File | null>(
    null,
  );
  const [supportingDocument, setSupportingDocument] =
    React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRequests();
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setType("SUPPORT");
    setSupportRequestType("");
    setSupportRequestTypeOther("");
    setExpectedCompletionDate("");
    setSupportAdditionalNotes("");
    setLeaveType("");
    setClaimPurpose("");
    setClaimPurposeOther("");
    setManagerId(requester.managers[0]?.id ?? "");
    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setExpenseDate("");
    setAmount("");
    setCurrency(requester.currency);
    setBankName("");
    setAccountNumber("");
    setIbanSwift("");
    setReceiptDocument(null);
    setSupportingDocument(null);
    setError(null);
  }

  async function onSubmit() {
    const v = validateRequest({
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
      managerEmployeeId: managerId,
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

    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
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
        managerEmployeeId: managerId,
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

      await createRequest(payload);
      setOpen(false);
      resetForm();
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">My Requests</h1>
          <p className="text-sm text-muted-foreground">
            Submit leave, claims, or support requests and track their status.
          </p>
        </div>

        <CreateRequestDialog
          requester={requester}
          open={open}
          setOpen={setOpen}
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
          submitting={submitting}
          onSubmit={onSubmit}
          onReset={resetForm}
        />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Recent Requests</CardTitle>
            <Button
              variant="blueGradiant"
              className="rounded-xl text-white"
              onClick={load}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <RequestList rows={rows} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
