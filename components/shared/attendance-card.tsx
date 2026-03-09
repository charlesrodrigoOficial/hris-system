"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LEAVE"
  | "HOLIDAY"
  | "WEEKOFF"
  | "PUBLIC_HOLIDAY";

type WorkMode = "OFFICE" | "REMOTE";

type Attendance = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  workingHours: string | number | null;
  workMode?: WorkMode | null;
};

function formatTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusVariant(
  status: AttendanceStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "PRESENT") return "default";
  if (status === "ABSENT") return "destructive";
  if (status === "LEAVE") return "secondary";
  if (
    status === "PUBLIC_HOLIDAY" ||
    status === "HOLIDAY" ||
    status === "WEEKOFF"
  )
    return "outline";
  return "secondary";
}

function statusLabel(status: AttendanceStatus) {
  switch (status) {
    case "PUBLIC_HOLIDAY":
      return "Public Holiday";
    case "WEEKOFF":
      return "Week Off";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

function isBlocked(status: AttendanceStatus) {
  return ["LEAVE", "HOLIDAY", "PUBLIC_HOLIDAY", "WEEKOFF"].includes(status);
}

export function AttendanceCard() {
  const [attendance, setAttendance] = React.useState<Attendance | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<null | "in" | "out">(
    null,
  );
  const [workMode, setWorkMode] = React.useState<WorkMode>("OFFICE");
  const [error, setError] = React.useState<string | null>(null);

  async function loadToday() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/attendance/today", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Failed to load attendance");
      setAttendance(null);
      setLoading(false);
      return;
    }
    setAttendance(data.attendance ?? null);
    if (data.attendance?.workMode) setWorkMode(data.attendance.workMode);
    setLoading(false);
  }

  React.useEffect(() => {
    void loadToday();
  }, []);

  async function checkIn() {
    setActionLoading("in");
    setError(null);
    const res = await fetch("/api/attendance/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workMode }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Check-in failed");
      setActionLoading(null);
      return;
    }
    setAttendance(data.attendance);
    setActionLoading(null);
  }

  async function checkOut() {
    setActionLoading("out");
    setError(null);
    const res = await fetch("/api/attendance/check-out", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Check-out failed");
      setActionLoading(null);
      return;
    }
    setAttendance(data.attendance);
    setActionLoading(null);
  }

  const state = React.useMemo(() => {
    if (!attendance) return "NO_RECORD";
    if (isBlocked(attendance.status)) return "BLOCKED";
    if (attendance.checkIn && !attendance.checkOut) return "CHECKED_IN";
    if (attendance.checkIn && attendance.checkOut) return "DONE";
    return "NO_RECORD";
  }, [attendance]);

  return (
    <Card className="w-full bg-gradient-to-r border-b-8 border-b-slate-300 from-blue-950 p-3 via-blue-600 to-blue-400 text-white shadow-xl rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Attendance</CardTitle>

        {attendance?.status ? (
          <Badge variant={statusVariant(attendance.status)}>
            {statusLabel(attendance.status)}
          </Badge>
        ) : (
          <Badge variant="secondary">Not marked</Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-md  border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border p-3">
            <div className="text-white">Check in</div>
            <div className="mt-1 font-medium">
              {formatTime(attendance?.checkIn ?? null)}
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-white ">Check out</div>
            <div className="mt-1 font-medium">
              {formatTime(attendance?.checkOut ?? null)}
            </div>
          </div>
        </div>

        {/* Work mode selector shown only before check-in */}
        {state === "NO_RECORD" && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Work mode</div>
            <RadioGroup
              value={workMode}
              onValueChange={(v) => setWorkMode(v as WorkMode)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="OFFICE" id="office" />
                <Label htmlFor="office">Office</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REMOTE" id="remote" />
                <Label htmlFor="remote">Remote</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="flex items-center gap-2">
          {loading ? (
            <Button disabled className="w-full">
              Loading…
            </Button>
          ) : state === "BLOCKED" ? (
            <Button disabled className="w-full">
              Attendance blocked ({statusLabel(attendance!.status)})
            </Button>
          ) : state === "NO_RECORD" ? (
            <Button
              className="w-full"
              onClick={checkIn}
              disabled={actionLoading !== null}
            >
              {actionLoading === "in" ? "Checking in…" : "Check In"}
            </Button>
          ) : state === "CHECKED_IN" ? (
            <Button
              className="w-full"
              variant="destructive"
              onClick={checkOut}
              disabled={actionLoading !== null}
            >
              {actionLoading === "out" ? "Checking out…" : "Check Out"}
            </Button>
          ) : (
            <Button
              className="w-full bg-blue-600"
              variant="blue"
              onClick={loadToday}
            >
              Completed (Refresh)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
