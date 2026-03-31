"use client";

import { Badge } from "@/components/ui/badge";
import { STATUS_META, formatDate, typeLabel } from "@/lib/requests/helpers";
import type { RequestRow } from "@/lib/requests/types";

type Props = {
  request: RequestRow;
  isFocused?: boolean;
};

export default function RequestListItem({ request, isFocused = false }: Props) {
  const meta = STATUS_META[request.status] ?? STATUS_META.PENDING;

  return (
    <div
      id={`request-row-${request.id}`}
      className={`flex items-start justify-between gap-4 border-b pb-3 ${isFocused ? "rounded-md bg-blue-50/60 p-3 ring-1 ring-blue-200" : ""}`}
    >
      <div className="space-y-1">
        <p className="font-medium">{request.title || typeLabel(request.type)}</p>
        <p className="text-sm text-muted-foreground">
          {typeLabel(request.type)} - Submitted on {formatDate(request.createdAt)}
        </p>

        {request.type === "LEAVE" && (request.startDate || request.endDate) && (
          <p className="text-sm text-muted-foreground">
            {request.startDate ? `From ${formatDate(request.startDate)}` : ""}
            {request.endDate ? ` to ${formatDate(request.endDate)}` : ""}
          </p>
        )}

        {request.type === "CLAIM" && request.expenseDate && (
          <p className="text-sm text-muted-foreground">
            Expense date: {formatDate(request.expenseDate)}
          </p>
        )}

        {request.type === "CLAIM" && request.amount && (
          <p className="text-sm text-muted-foreground">
            Amount: {request.currency ?? "GBP"} {String(request.amount)}
          </p>
        )}

        {request.description && (
          <p className="whitespace-pre-line text-sm">{request.description}</p>
        )}
      </div>

      <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
    </div>
  );
}
