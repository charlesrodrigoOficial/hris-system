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
    <Card className="relative w-full overflow-hidden rounded-lg border border-sky-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.96),_rgba(224,242,254,0.94)_28%,_rgba(191,219,254,0.9)_62%,_rgba(147,197,253,0.92)_100%)] p-3 text-slate-900 shadow-[0_18px_44px_-30px_rgba(29,78,216,0.32)]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold bg-gradient-to-r from-sky-700 via-blue-700 to-cyan-600 bg-clip-text text-transparent">
          Attendance
        </CardTitle>

        {attendance?.status ? (
          <Badge variant={statusVariant(attendance.status)}>
            {statusLabel(attendance.status)}
          </Badge>
        ) : (
          <Badge variant="secondary">Not marked</Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="dashboard-gradient-soft rounded-md p-3">
            <div className="text-slate-700">Check in</div>
            <div className="mt-1 font-medium">
              {formatTime(attendance?.checkIn ?? null)}
            </div>
          </div>

          <div className="dashboard-gradient-soft rounded-md p-3">
            <div className="text-slate-700">Check out</div>
            <div className="mt-1 font-medium">
              {formatTime(attendance?.checkOut ?? null)}
            </div>
          </div>
        </div>

        {/* Work mode selector shown only before check-in */}
        {state === "NO_RECORD" && (
          <div className="space-y-2">
            <div className="text-xs text-slate-600">Work mode</div>
            <RadioGroup
              value={workMode}
              onValueChange={(v) => setWorkMode(v as WorkMode)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="OFFICE" id="office" />
                <Label htmlFor="office" className="text-xs">Office</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REMOTE" id="remote" />
                <Label htmlFor="remote" className="text-xs">Remote</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="flex items-center gap-2">
          {loading ? (
            <Button disabled className="w-full text-xs">
              Loading…
            </Button>
          ) : state === "BLOCKED" ? (
            <Button disabled className="w-full text-xs">
              Attendance blocked ({statusLabel(attendance!.status)})
            </Button>
          ) : state === "NO_RECORD" ? (
            <Button
              className="w-full text-xs"
              onClick={checkIn}
              disabled={actionLoading !== null}
            >
              {actionLoading === "in" ? "Checking in…" : "Check In"}
            </Button>
          ) : state === "CHECKED_IN" ? (
            <Button
              className="w-full text-xs"
              variant="destructive"
              onClick={checkOut}
              disabled={actionLoading !== null}
            >
              {actionLoading === "out" ? "Checking out…" : "Check Out"}
            </Button>
          ) : (
            <Button
              className="w-full bg-blue-600 text-xs"
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
