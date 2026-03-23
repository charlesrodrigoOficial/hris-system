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
      month: "short",
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
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<AttendanceItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState(getCurrentMonthValue);
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

  React.useEffect(() => {
    if (!open) return;
    if (loaded) return;

    void loadAttendance();
  }, [open, loaded]);

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
  const selectedDateLabel = selectedDate ? formatDate(selectedDate) : "All days";
  const monthBounds = getMonthBounds(selectedMonth);

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
          <DialogHeader>
            <DialogTitle>Your Attendance History</DialogTitle>
            <DialogDescription>
              Review monthly attendance totals and inspect a specific day when
              needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Input
                type="month"
                value={selectedMonth}
                onChange={(event) =>
                  setSelectedMonth(event.target.value || getCurrentMonthValue())
                }
                aria-label="Select month"
              />

              <Input
                type="date"
                value={selectedDate}
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
                        <td className="p-3">{formatHours(item.workingHours)}</td>
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
