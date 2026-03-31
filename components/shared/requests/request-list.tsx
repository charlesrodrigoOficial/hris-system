"use client";

import type { RequestRow } from "@/lib/requests/types";
import RequestListItem from "./request-list-item";

type Props = {
  rows: RequestRow[];
  loading: boolean;
  focusRequestId?: string | null;
};

export default function RequestList({ rows, loading, focusRequestId }: Props) {
  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Loading requests...</div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No requests yet. Click <span className="font-medium">Create Request</span> to submit one.
      </div>
    );
  }

  return (
    <>
      {rows.map((r) => (
        <RequestListItem
          key={r.id}
          request={r}
          isFocused={Boolean(focusRequestId && r.id === focusRequestId)}
        />
      ))}
    </>
  );
}
