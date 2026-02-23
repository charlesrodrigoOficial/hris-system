"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function RequestsPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">My Requests</h1>
        <Button>Create Request</Button>
      </div>

      {/* Request List */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Example Row */}
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <p className="font-medium">Leave Request</p>
              <p className="text-sm text-muted-foreground">
                Submitted on 22 Feb 2026
              </p>
            </div>

            <Badge variant="secondary">Pending</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
