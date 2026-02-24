"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { RequestRow, RequestType } from "@/lib/requests/types";
import { fetchRequests, createRequest } from "@/lib/requests/clients";
import {
  STATUS_META,
  formatDate,
  typeLabel,
  validateRequest,
  buildPayload,
} from "@/lib/requests/helpers";

export default function RequestsPage() {
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState<RequestRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  // form
  const [type, setType] = React.useState<RequestType>("SUPPORT");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("GBP");

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
    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setAmount("");
    setCurrency("GBP");
    setError(null);
  }

  async function onSubmit() {
    const v = validateRequest({
      type,
      title,
      description,
      startDate,
      endDate,
      amount,
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
        startDate,
        endDate,
        amount,
        currency,
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">My Requests</h1>
          <p className="text-sm text-muted-foreground">
            Submit leave, claims, or support requests and track their status.
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="blueGradiant" className="rounded-xl text-white">Create Request</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[560px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create a request</DialogTitle>
              <DialogDescription>
                Choose a request type and provide the details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Type */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Request Type</p>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as RequestType)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPPORT">Support</SelectItem>
                    <SelectItem value="LEAVE">Leave</SelectItem>
                    <SelectItem value="CLAIM">Claim / Reimbursement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Title</p>
                <Input
                  className="rounded-xl"
                  placeholder={
                    type === "SUPPORT"
                      ? "e.g. Account issue / System access"
                      : "Optional (auto-filled if empty)"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {type === "LEAVE" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Start date</p>
                    <Input
                      className="rounded-xl"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">End date</p>
                    <Input
                      className="rounded-xl"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {type === "CLAIM" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Amount</p>
                    <Input
                      className="rounded-xl"
                      type="number"
                      inputMode="decimal"
                      placeholder="e.g. 25.50"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Currency</p>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="MYR">MYR</SelectItem>
                        <SelectItem value="IDR">IDR</SelectItem>
                        <SelectItem value="PKR">PKR</SelectItem>
                        <SelectItem value="THB">THB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {type === "SUPPORT" ? "Message" : "Description"}
                </p>
                <Textarea
                  className="min-h-[120px] rounded-xl"
                  placeholder={
                    type === "LEAVE"
                      ? "Reason for leave, handover notes, etc."
                      : type === "CLAIM"
                        ? "What is this claim for? (Taxi, meal, equipment...)"
                        : "Describe the issue and what you need help with."
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
                  {error}
                </div>
              )}
            </div>

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
      </div>

      {/* Request List */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Recent Requests</CardTitle>
            <Button variant="blueGradiant" className="rounded-xl text-white" onClick={load}>
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">
              Loading requests...
            </div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No requests yet. Click{" "}
              <span className="font-medium">Create Request</span> to submit one.
            </div>
          ) : (
            rows.map((r) => {
              const meta = STATUS_META[r.status] ?? STATUS_META.PENDING;

              return (
                <div
                  key={r.id}
                  className="flex justify-between items-start gap-4 border-b pb-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {r.title || typeLabel(r.type)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {typeLabel(r.type)} • Submitted on{" "}
                      {formatDate(r.createdAt)}
                    </p>

                    {r.type === "LEAVE" && (r.startDate || r.endDate) && (
                      <p className="text-sm text-muted-foreground">
                        {r.startDate ? `From ${formatDate(r.startDate)}` : ""}
                        {r.endDate ? ` to ${formatDate(r.endDate)}` : ""}
                      </p>
                    )}

                    {r.type === "CLAIM" && r.amount && (
                      <p className="text-sm text-muted-foreground">
                        Amount: {r.currency ?? "GBP"} {String(r.amount)}
                      </p>
                    )}

                    {r.description && (
                      <p className="text-sm">{r.description}</p>
                    )}
                  </div>

                  <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
