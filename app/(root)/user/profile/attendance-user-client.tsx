"use client";

import * as React from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ATTENDANCE_UPDATED_EVENT } from "@/lib/attendance/events";

type AttendanceStatus =
  | "PRESENT"
  | "HALF_DAY"
  | "ABSENT"
  | "LEAVE"
  | "HOLIDAY"
  | "WEEKOFF"
  | "PUBLIC_HOLIDAY";

type WorkMode = "OFFICE" | "REMOTE";

type AttendanceItem = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: string | number | null;
  status: AttendanceStatus;
  workMode: WorkMode;
  createdAt: string;
};

type AttendanceToday = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  workMode?: WorkMode | null;
};

type AttendanceUserClientProps = {
  renderTrigger?: (openDialog: () => void) => React.ReactNode;
};

function getDateOnly(value: string) {
  return value.slice(0, 10);
}

function getMonthValue(value: string) {
  return getDateOnly(value).slice(0, 7);
}

function getCurrentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function getCurrentDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthBounds(value: string) {
  const [year, month] = value.split("-").map(Number);

  if (!year || !month) {
    return { min: "", max: "" };
  }

  const lastDay = new Date(year, month, 0).getDate();

  return {
    min: `${value}-01`,
    max: `${value}-${String(lastDay).padStart(2, "0")}`,
  };
}

function formatDate(value: string) {
  return new Date(`${getDateOnly(value)}T12:00:00`).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );
}

function formatMonthLabel(value: string) {
  if (!value) return "Selected month";

  return new Date(`${value}-01T12:00:00`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function formatTime(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function readJsonSafe(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  if (!contentType.includes("application/json")) {
    return { data: null as unknown, text, isJson: false };
  }

  if (!text.trim()) {
    return { data: null as unknown, text: "", isJson: false };
  }

  try {
    return { data: JSON.parse(text) as unknown, text, isJson: true };
  } catch {
    return { data: null as unknown, text, isJson: false };
  }
}

function toHoursNumber(value: string | number | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatHours(value: string | number | null) {
  if (value == null) return "-";
  return `${toHoursNumber(value).toFixed(1)}h`;
}

function statusVariant(
  status: AttendanceStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "PRESENT") return "default";
  if (status === "ABSENT") return "destructive";
  if (status === "HALF_DAY" || status === "LEAVE") return "secondary";
  return "outline";
}

function statusLabel(status: AttendanceStatus) {
  if (status === "PUBLIC_HOLIDAY") return "Public Holiday";
  if (status === "WEEKOFF") return "Week Off";
  if (status === "HALF_DAY") return "Half Day";

  return status.charAt(0) + status.slice(1).toLowerCase();
}

function isBlockedStatus(status: AttendanceStatus) {
  return ["LEAVE", "HOLIDAY", "PUBLIC_HOLIDAY", "WEEKOFF"].includes(status);
}

function SummaryTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 px-4 py-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

export default function AttendanceUserClient({
  renderTrigger,
}: AttendanceUserClientProps) {
  const timeZone = React.useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<AttendanceItem[]>([]);
  const [todayAttendance, setTodayAttendance] =
    React.useState<AttendanceToday | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [todayLoading, setTodayLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<null | "in" | "out">(
    null,
  );
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [now, setNow] = React.useState(() => new Date());
  const [selectedMonthDate, setSelectedMonthDate] =
    React.useState(getCurrentDateValue);
  const [selectedMonth, setSelectedMonth] = React.useState(() =>
    getMonthValue(getCurrentDateValue()),
  );
  const [selectedDate, setSelectedDate] = React.useState("");

  async function loadAttendance() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/attendance/history", {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        setItems([]);
        setError(data?.error ?? "Failed to load attendance history");
        return;
      }

      setItems(data.items ?? []);
    } catch {
      setItems([]);
      setError("Failed to load attendance history");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  async function loadTodayAttendance() {
    setTodayLoading(true);
    setActionError(null);

    try {
      const res = await fetch(
        `/api/attendance/today?tz=${encodeURIComponent(timeZone)}`,
        {
          cache: "no-store",
        },
      );
      const { data } = await readJsonSafe(res);
      const payload = (data as { attendance?: AttendanceToday | null }) ?? {};

      if (!res.ok) {
        setTodayAttendance(null);
        setActionError(
          (data as { error?: string } | null)?.error ??
            "Failed to load today's attendance",
        );
        return;
      }

      setTodayAttendance(payload.attendance ?? null);
    } catch {
      setTodayAttendance(null);
      setActionError("Failed to load today's attendance");
    } finally {
      setTodayLoading(false);
    }
  }

  async function handleAttendanceAction() {
    const isCheckedIn = Boolean(
      todayAttendance?.checkIn && !todayAttendance?.checkOut,
    );
    const endpoint = isCheckedIn
      ? "/api/attendance/check-out"
      : "/api/attendance/check-in";
    const loadingState = isCheckedIn ? "out" : "in";

    setActionLoading(loadingState);
    setActionError(null);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeZone,
          workMode: todayAttendance?.workMode ?? "OFFICE",
        }),
      });
      const { data, text, isJson } = await readJsonSafe(res);
      const payload = (data as { attendance?: AttendanceToday; error?: string }) ?? {};

      if (!res.ok || !payload.attendance) {
        setActionError(
          payload.error ??
            (!isJson && text
              ? `${isCheckedIn ? "Check-out" : "Check-in"} failed (unexpected response). Please sign in again.`
              : `${isCheckedIn ? "Check-out" : "Check-in"} failed`),
        );
        return;
      }

      setTodayAttendance(payload.attendance);
      window.dispatchEvent(new Event(ATTENDANCE_UPDATED_EVENT));
      await loadAttendance();
    } catch {
      setActionError(
        `${isCheckedIn ? "Check-out" : "Check-in"} failed. Please try again.`,
      );
    } finally {
      setActionLoading(null);
    }
  }

  React.useEffect(() => {
    if (!open) return;
    if (loaded) return;

    void loadAttendance();
  }, [open, loaded]);

  React.useEffect(() => {
    if (!open) return;

    void loadTodayAttendance();
  }, [open, timeZone]);

  React.useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => clearInterval(timer);
  }, [open]);

  React.useEffect(() => {
    if (!selectedDate) return;
    if (selectedDate.startsWith(selectedMonth)) return;

    setSelectedDate("");
  }, [selectedDate, selectedMonth]);

  const monthItems = React.useMemo(
    () => items.filter((item) => getMonthValue(item.date) === selectedMonth),
    [items, selectedMonth],
  );

  const visibleItems = React.useMemo(() => {
    if (!selectedDate) return monthItems;

    return monthItems.filter((item) => getDateOnly(item.date) === selectedDate);
  }, [monthItems, selectedDate]);

  const summary = React.useMemo(() => {
    const presentCount = monthItems.filter(
      (item) => item.status === "PRESENT",
    ).length;
    const absentCount = monthItems.filter(
      (item) => item.status === "ABSENT",
    ).length;
    const totalWorkingHours = monthItems.reduce(
      (sum, item) => sum + toHoursNumber(item.workingHours),
      0,
    );
    const workedDays = monthItems.filter(
      (item) => toHoursNumber(item.workingHours) > 0,
    ).length;

    return {
      presentCount,
      absentCount,
      totalWorkingHours,
      averageWorkingHours: workedDays > 0 ? totalWorkingHours / workedDays : 0,
    };
  }, [monthItems]);

  const selectedMonthLabel = formatMonthLabel(selectedMonth);
  const selectedDateLabel = selectedDate
    ? formatDate(selectedDate)
    : "All days";
  const monthBounds = getMonthBounds(selectedMonth);
  const actionState = React.useMemo(() => {
    if (!todayAttendance) return "NO_RECORD";
    if (isBlockedStatus(todayAttendance.status)) return "BLOCKED";
    if (todayAttendance.checkIn && !todayAttendance.checkOut) return "CHECKED_IN";
    if (todayAttendance.checkIn && todayAttendance.checkOut) return "DONE";
    return "NO_RECORD";
  }, [todayAttendance]);
  const actionTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setOpen(true))
      ) : (
        <Button
          type="button"
          size="lg"
          className="gap-2 bg-white font-semibold hover:bg-blue-900 hover:text-white"
          onClick={() => setOpen(true)}
        >
          <CalendarCheck className="h-4 w-4" />
          Attendance
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-hidden rounded-2xl sm:max-w-4xl">
          <DialogHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <DialogTitle>Attendance</DialogTitle>
              <DialogDescription>
                Review monthly attendance totals and inspect a specific day when
                needed.
              </DialogDescription>
            </div>

            <Button
              type="button"
              onClick={() => void handleAttendanceAction()}
              disabled={
                todayLoading ||
                actionLoading !== null ||
                actionState === "BLOCKED" ||
                actionState === "DONE"
              }
              variant={actionState === "CHECKED_IN" ? "destructive" : "default"}
              className="min-w-[170px] shrink-0"
            >
              {todayLoading ? (
                "Loading..."
              ) : actionLoading === "in" ? (
                "Checking in..."
              ) : actionLoading === "out" ? (
                "Checking out..."
              ) : actionState === "CHECKED_IN" ? (
                `Check Out (${actionTime})`
              ) : actionState === "BLOCKED" ? (
                `Blocked (${statusLabel(todayAttendance!.status)})`
              ) : actionState === "DONE" ? (
                `Checked Out (${formatTime(todayAttendance?.checkOut ?? null)})`
              ) : (
                `Check In (${actionTime})`
              )}
            </Button>
          </DialogHeader>

          <div className="space-y-4">
            {actionError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {actionError}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Input
                type="date"
                value={selectedMonthDate}
                lang="en-GB"
                onChange={(event) => {
                  const nextDate = event.target.value || getCurrentDateValue();
                  setSelectedMonthDate(nextDate);
                  setSelectedMonth(
                    getMonthValue(nextDate) || getCurrentMonthValue(),
                  );
                }}
                aria-label="Select month (date)"
              />

              <Input
                type="date"
                value={selectedDate}
                lang="en-GB"
                min={monthBounds.min}
                max={monthBounds.max}
                onChange={(event) => setSelectedDate(event.target.value)}
                aria-label="Select date"
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedDate("")}
                disabled={!selectedDate}
              >
                Clear date
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryTile
                label="Total present"
                value={String(summary.presentCount)}
                hint={selectedMonthLabel}
              />
              <SummaryTile
                label="Total absent"
                value={String(summary.absentCount)}
                hint={selectedMonthLabel}
              />
              <SummaryTile
                label="Working hours"
                value={`${summary.totalWorkingHours.toFixed(1)}h`}
                hint={selectedMonthLabel}
              />
              <SummaryTile
                label="Average per day"
                value={`${summary.averageWorkingHours.toFixed(1)}h`}
                hint="Based on days with logged hours"
              />
            </div>

            <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-muted-foreground">Viewing records for</div>
                <div className="font-semibold">
                  {selectedMonthLabel}
                  {selectedDate ? ` - ${selectedDateLabel}` : ""}
                </div>
              </div>

              <div className="md:text-right">
                <div className="text-muted-foreground">Records shown</div>
                <div className="font-semibold">
                  {visibleItems.length} of {monthItems.length} this month
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="max-h-[55vh] overflow-auto rounded-xl border">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="sticky top-0 bg-muted/95 backdrop-blur">
                  <tr className="text-left">
                    <th className="p-3">Date</th>
                    <th className="p-3">Check In</th>
                    <th className="p-3">Check Out</th>
                    <th className="p-3">Hours</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-6 text-center text-muted-foreground"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading attendance...
                        </span>
                      </td>
                    </tr>
                  ) : visibleItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-6 text-center text-muted-foreground"
                      >
                        No attendance records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    visibleItems.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3 font-medium">
                          {formatDate(item.date)}
                        </td>
                        <td className="p-3">{formatTime(item.checkIn)}</td>
                        <td className="p-3">{formatTime(item.checkOut)}</td>
                        <td className="p-3">
                          {formatHours(item.workingHours)}
                        </td>
                        <td className="p-3">{item.workMode}</td>
                        <td className="p-3">
                          <Badge variant={statusVariant(item.status)}>
                            {statusLabel(item.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadAttendance()}
              >
                Refresh
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
