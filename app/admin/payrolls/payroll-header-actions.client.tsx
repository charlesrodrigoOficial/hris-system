"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type PayrollRunStatus =
  | "NOT_STARTED"
  | "DRAFT"
  | "CALCULATED"
  | "IN_REVIEW"
  | "APPROVED"
  | "COMPLETED";

type PayrollAction = "START_RUN" | "CALCULATE" | "REVIEW" | "PUBLISH";

type Props = {
  runStatus: PayrollRunStatus;
};

export default function PayrollHeaderActions({ runStatus }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pendingAction, setPendingAction] = React.useState<PayrollAction | null>(null);

  async function runPayrollAction(action: PayrollAction) {
    setPendingAction(action);

    try {
      const res = await fetch("/api/admin/payrolls/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const payload = (await res.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!res.ok) {
        throw new Error(payload?.error || "Failed to run payroll action.");
      }

      toast({
        description: payload?.message || "Payroll action completed.",
      });

      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        description:
          error instanceof Error ? error.message : "Payroll action failed.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  const isBusy = pendingAction !== null;
  const canStart =
    runStatus === "NOT_STARTED" ||
    runStatus === "DRAFT" ||
    runStatus === "COMPLETED";

  const canCalculate =
    runStatus === "DRAFT" || runStatus === "CALCULATED" || runStatus === "IN_REVIEW";

  const canReview = runStatus === "CALCULATED";

  const canPublish = runStatus === "IN_REVIEW" || runStatus === "APPROVED";

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        disabled={isBusy || !canStart}
        onClick={() => runPayrollAction("START_RUN")}
      >
        {pendingAction === "START_RUN" ? "Starting..." : "Start Run"}
      </Button>

      <Button
        variant="outline"
        disabled={isBusy || !canCalculate}
        onClick={() => runPayrollAction("CALCULATE")}
      >
        {pendingAction === "CALCULATE" ? "Calculating..." : "Calculate"}
      </Button>

      <Button
        variant="outline"
        disabled={isBusy || !canReview}
        onClick={() => runPayrollAction("REVIEW")}
      >
        {pendingAction === "REVIEW" ? "Reviewing..." : "Review"}
      </Button>

      <Button
        disabled={isBusy || !canPublish}
        onClick={() => runPayrollAction("PUBLISH")}
      >
        {pendingAction === "PUBLISH" ? "Publishing..." : "Publish Payslips"}
      </Button>
    </div>
  );
}
