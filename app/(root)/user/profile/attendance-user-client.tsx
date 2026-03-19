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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
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

export default function AttendanceUserClient({
  renderTrigger,
}: AttendanceUserClientProps) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<AttendanceItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function loadAttendance() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/attendance/history", {
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      setItems([]);
      setError(data?.error ?? "Failed to load attendance history");
      setLoading(false);
      setLoaded(true);
      return;
    }

    setItems(data.items ?? []);
    setLoading(false);
    setLoaded(true);
  }

  React.useEffect(() => {
    if (!open) return;
    if (loaded) return;

    void loadAttendance();
  }, [open, loaded]);

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setOpen(true))
      ) : (
        <Button
          type="button"
          size="lg"
          className="gap-2 font-semibold bg-white hover:bg-blue-900 hover:text-white"
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
              View all attendance records pulled from the database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Total records</span>
              <span className="font-semibold">{items.length}</span>
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
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading attendance...
                        </span>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">
                        No attendance records found.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3 font-medium">{formatDate(item.date)}</td>
                        <td className="p-3">{formatTime(item.checkIn)}</td>
                        <td className="p-3">{formatTime(item.checkOut)}</td>
                        <td className="p-3">{item.workingHours ?? "-"}</td>
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
              <Button type="button" variant="outline" onClick={() => void loadAttendance()}>
                Refresh
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
