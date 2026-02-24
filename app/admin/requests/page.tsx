"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminRequestRow, RequestStatus } from "@/lib/requests/types";
import { STATUS_META } from "@/lib/requests/helpers";
export default function AdminRequestsPage() {
  const [rows, setRows] = React.useState<AdminRequestRow[]>([]);

  async function load() {
    const res = await fetch("/api/admin/requests", { cache: "no-store" });
    const data = (await res.json()) as AdminRequestRow[];
    setRows(data);
  }

  React.useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    load();
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {rows.map((r) => {
            const meta = STATUS_META[r.status];

            return (
              <div
                key={r.id}
                className="flex justify-between items-center border-b pb-3"
              >
                <div>
                  <p className="font-medium">
                    {r.title} — {r.user?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {r.user?.email}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={meta.badgeVariant}>{meta.label}</Badge>

                  <Button
                    size="sm"
                    onClick={() => updateStatus(r.id, "APPROVED")}
                  >
                    Approve
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus(r.id, "REJECTED")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
