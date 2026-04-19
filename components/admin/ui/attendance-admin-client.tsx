"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AttendanceStatus =
  | "PRESENT"
  | "HALF_DAY"
  | "ABSENT"
  | "LEAVE"
  | "HOLIDAY"
  | "WEEKOFF"
  | "PUBLIC_HOLIDAY";

type AttendanceRow = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: string | number | null;
  status: AttendanceStatus;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    employmentType?: string | null;
  };
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString();
}

function formatTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toTimeInputValue(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function toIsoFromDateAndTime(dateValue: string, timeValue: string) {
  if (!timeValue) return null;
  const dateOnly = dateValue.slice(0, 10);
  const localDate = new Date(`${dateOnly}T${timeValue}:00`);
  if (Number.isNaN(localDate.getTime())) return null;
  return localDate.toISOString();
}

function statusVariant(
  status: AttendanceStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "PRESENT") return "default";
  if (status === "ABSENT") return "destructive";
  if (status === "LEAVE" || status === "HALF_DAY") return "secondary";
  if (
    status === "PUBLIC_HOLIDAY" ||
    status === "HOLIDAY" ||
    status === "WEEKOFF"
  )
    return "outline";
  return "secondary";
}

export default function AttendanceAdminClient() {
  const [items, setItems] = React.useState<AttendanceRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftCheckIn, setDraftCheckIn] = React.useState("");
  const [draftCheckOut, setDraftCheckOut] = React.useState("");

  // Filters
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<string>("ALL");

  // Default dates: today
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [from, setFrom] = React.useState(today);
  const [to, setTo] = React.useState(today);

  // Pagination
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const [total, setTotal] = React.useState(0);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q,
        status,
        from,
        to,
        page: String(page),
        pageSize: String(pageSize),
      });

      const res = await fetch(`/api/admin/attendance?${params.toString()}`, {
        cache: "no-store",
      });

      const data = (await res.json()) as { items?: AttendanceRow[]; total?: number; error?: string };

      if (!res.ok) {
        setItems([]);
        setTotal(0);
        setError(data?.error ?? "Failed to load attendance records");
        return;
      }

      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setItems([]);
      setTotal(0);
      setError("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(row: AttendanceRow) {
    setEditingId(row.id);
    setDraftCheckIn(toTimeInputValue(row.checkIn));
    setDraftCheckOut(toTimeInputValue(row.checkOut));
    setActionError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftCheckIn("");
    setDraftCheckOut("");
    setActionError(null);
  }

  async function saveEdit(row: AttendanceRow) {
    if (draftCheckOut && !draftCheckIn) {
      setActionError("Check-in time is required when check-out is set.");
      return;
    }

    const checkInIso = toIsoFromDateAndTime(row.date, draftCheckIn);
    const checkOutIso = toIsoFromDateAndTime(row.date, draftCheckOut);

    if ((draftCheckIn && !checkInIso) || (draftCheckOut && !checkOutIso)) {
      setActionError("Invalid check-in/check-out time value.");
      return;
    }

    if (checkInIso && checkOutIso && new Date(checkOutIso) <= new Date(checkInIso)) {
      setActionError("Check-out must be later than check-in.");
      return;
    }

    setSavingId(row.id);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/attendance/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn: checkInIso,
          checkOut: checkOutIso,
        }),
      });
      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        setActionError(payload.error ?? "Failed to update attendance.");
        return;
      }

      cancelEdit();
      await load();
    } catch {
      setActionError("Failed to update attendance.");
    } finally {
      setSavingId(null);
    }
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const canGoNext = page * pageSize < total;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Management</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              placeholder="Search name or email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="HALF_DAY">Half Day</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="LEAVE">Leave</SelectItem>
                <SelectItem value="HOLIDAY">Holiday</SelectItem>
                <SelectItem value="WEEKOFF">Week Off</SelectItem>
                <SelectItem value="PUBLIC_HOLIDAY">Public Holiday</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setPage(1);
                void load();
              }}
              disabled={loading}
            >
              {loading ? "Loading..." : "Apply Filters"}
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                setQ("");
                setStatus("ALL");
                setFrom(today);
                setTo(today);
                setPage(1);
                setItems([]);
                setTotal(0);
                setError(null);
                cancelEdit();
              }}
            >
              Reset
            </Button>
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {actionError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {actionError}
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-3">Date</th>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Check In</th>
                  <th className="p-3">Check Out</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={8}>
                      {loading ? "Loading..." : "No records found"}
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="p-3">{formatDate(row.date)}</td>
                      <td className="p-3">{row.user?.name ?? "-"}</td>
                      <td className="p-3">{row.user?.email ?? "-"}</td>
                      <td className="p-3">
                        {editingId === row.id ? (
                          <Input
                            type="time"
                            value={draftCheckIn}
                            onChange={(event) => setDraftCheckIn(event.target.value)}
                            className="h-8 min-w-[120px]"
                          />
                        ) : (
                          formatTime(row.checkIn)
                        )}
                      </td>
                      <td className="p-3">
                        {editingId === row.id ? (
                          <Input
                            type="time"
                            value={draftCheckOut}
                            onChange={(event) => setDraftCheckOut(event.target.value)}
                            className="h-8 min-w-[120px]"
                          />
                        ) : (
                          formatTime(row.checkOut)
                        )}
                      </td>
                      <td className="p-3">{row.workingHours ?? "-"}</td>
                      <td className="p-3">
                        <Badge variant={statusVariant(row.status)}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {editingId === row.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => void saveEdit(row)}
                              disabled={savingId === row.id}
                            >
                              {savingId === row.id ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                              disabled={savingId === row.id}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(row)}
                            disabled={Boolean(savingId)}
                          >
                            Edit Times
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Total: {total} - Page {page}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Prev
              </Button>

              <Button
                variant="outline"
                onClick={() => setPage((p) => (canGoNext ? p + 1 : p))}
                disabled={!canGoNext || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
