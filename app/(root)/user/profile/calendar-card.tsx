"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { isGoogleMeetUrl } from "@/lib/calender/functions/meeting-link";

type CalendarCardProps = {
  className?: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  meetLink?: string | null;
  type: string;
  start: string;
  end: string;
  allDay?: boolean;
  color?: string | null;
};

type CalendarCell = {
  date: Date;
  inCurrentMonth: boolean;
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_COLORS: Record<string, string> = {
  EVENT: "#0ea5e9",
  HOLIDAY: "#3b82f6",
  MEETING: "#8b5cf6",
  PAYROLL: "#22c55e",
  SHIFT: "#f97316",
  ANNOUNCEMENT: "#64748b",
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

function endOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

function buildCalendarGrid(viewDate: Date): CalendarCell[] {
  const monthStart = new Date(
    Date.UTC(viewDate.getUTCFullYear(), viewDate.getUTCMonth(), 1),
  );
  const leadingDays = monthStart.getUTCDay();
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(gridStart.getUTCDate() - leadingDays);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);

    return {
      date,
      inCurrentMonth: date.getUTCMonth() === viewDate.getUTCMonth(),
    };
  });
}

function formatMonthParam(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getEventColor(event: CalendarEvent) {
  if (event.color) return event.color;
  return EVENT_COLORS[event.type] ?? "#94a3b8";
}

function buildEventsByDate(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    let current = startOfUtcDay(new Date(event.start));
    const end = endOfUtcDay(new Date(event.end));

    while (current <= end) {
      const key = toDateKey(current);
      const existing = map.get(key) ?? [];
      existing.push(event);
      map.set(key, existing);

      current = new Date(current);
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  return map;
}

export function CalendarCard({ className }: CalendarCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const monthParam = useMemo(() => formatMonthParam(viewDate), [viewDate]);
  const monthLabel = useMemo(() => getMonthLabel(viewDate), [viewDate]);
  const cells = useMemo(() => buildCalendarGrid(viewDate), [viewDate]);
  const eventsByDate = useMemo(() => buildEventsByDate(events), [events]);
  const todayKey = useMemo(() => toDateKey(new Date()), []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        cardRef.current &&
        event.target instanceof Node &&
        !cardRef.current.contains(event.target)
      ) {
        setSelectedDateKey(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function loadEvents() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/calendar/events?month=${monthParam}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load calendar events (${response.status}).`);
        }

        const payload = (await response.json()) as { events?: CalendarEvent[] };

        if (isMounted) {
          setEvents(Array.isArray(payload.events) ? payload.events : []);
          setSelectedDateKey(null);
        }
      } catch (loadError) {
        if (!controller.signal.aborted && isMounted) {
          setEvents([]);
          setSelectedDateKey(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load calendar events.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadEvents();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [monthParam]);

  return (
    <Card
      ref={cardRef}
      className={cn(
        "relative overflow-visible rounded-2xl border border-[#BFDBFE] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(219,234,254,0.92)_30%,_rgba(191,219,254,0.9)_62%,_rgba(147,197,253,0.9)_100%)] p-4 text-[#0F172A] shadow-[0_18px_44px_-30px_rgba(11,31,95,0.35)]",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/70 bg-[#DBEAFE]/80 text-[#1D4ED8] shadow-sm">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <p className="bg-gradient-to-r from-[#0B1F5F] via-[#1D4ED8] to-[#1D4ED8] bg-clip-text text-sm font-semibold text-transparent">
              Calendar
            </p>
            <p className="text-xs text-[#64748B]">Synced with Admin updates</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() =>
              setViewDate(
                (prev) =>
                  new Date(
                    Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1),
                  ),
              )
            }
            className="h-7 w-7 rounded-md border-[#BFDBFE] bg-white/80 text-[#1D4ED8] hover:bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() =>
              setViewDate(
                (prev) =>
                  new Date(
                    Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1),
                  ),
              )
            }
            className="h-7 w-7 rounded-md border-[#BFDBFE] bg-white/80 text-[#1D4ED8] hover:bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="mb-1 text-center text-sm font-semibold text-[#0B1F5F]">{monthLabel}</p>
      <p
        className={cn(
          "mb-3 text-center text-[11px] text-[#64748B]",
          error && "text-rose-600",
        )}
      >
        {error
          ? error
          : isLoading
            ? "Syncing events..."
            : `${events.length} calendar item${events.length === 1 ? "" : "s"}`}
      </p>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="pb-1 font-semibold text-[#64748B]">
            {day}
          </div>
        ))}

        {cells.map((cell, index) => {
          const key = toDateKey(cell.date);
          const dayEvents = eventsByDate.get(key) ?? [];
          const isToday = key === todayKey;
          const dayLabel = cell.date.getUTCDate();
          const isSelected = selectedDateKey === key && dayEvents.length > 0;
          const rowIndex = Math.floor(index / 7);
          const columnIndex = index % 7;
          const popupDirectionClass = rowIndex >= 4 ? "bottom-full mb-1.5" : "top-full mt-1.5";
          const popupAlignClass = columnIndex >= 5 ? "right-0" : "left-0";

          const previewTitles = dayEvents
            .slice(0, 3)
            .map((event) => event.title)
            .join(", ");
          const tooltip = dayEvents.length
            ? `${previewTitles}${dayEvents.length > 3 ? ` (+${dayEvents.length - 3} more)` : ""}`
            : undefined;

          return (
            <div key={key} className="relative">
              <button
                type="button"
                title={tooltip}
                onClick={() => {
                  if (dayEvents.length === 0) {
                    setSelectedDateKey(null);
                    return;
                  }

                  setSelectedDateKey((prev) => (prev === key ? null : key));
                }}
                className={cn(
                  "relative flex h-9 w-full items-center justify-center rounded-md border border-transparent bg-white/70 text-xs transition",
                  cell.inCurrentMonth ? "text-[#0F172A]" : "text-[#94A3B8]",
                  isToday && "border-[#1D4ED8] bg-[#DBEAFE] font-semibold text-[#1D4ED8]",
                  dayEvents.length > 0 && "cursor-pointer hover:border-[#93C5FD]",
                  isSelected && "border-[#1D4ED8]",
                )}
                aria-expanded={isSelected}
                aria-label={
                  dayEvents.length > 0
                    ? `${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""} on ${getDateLabel(cell.date)}`
                    : `No events on ${getDateLabel(cell.date)}`
                }
              >
                <span>{dayLabel}</span>

                {dayEvents.length > 0 ? (
                  <>
                    <span className="absolute right-0.5 top-0.5 rounded-full bg-[#0B1F5F]/90 px-1 text-[9px] leading-4 text-white">
                      {dayEvents.length > 9 ? "9+" : dayEvents.length}
                    </span>
                    <div className="absolute bottom-0.5 flex items-center gap-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <span
                          key={`${key}-${event.id}`}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: getEventColor(event) }}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </button>

              {isSelected ? (
                <div
                  className={cn(
                    "absolute z-30 w-60 rounded-xl border border-[#BFDBFE] bg-white/95 p-2.5 text-left shadow-[0_16px_36px_-20px_rgba(11,31,95,0.6)] backdrop-blur-sm",
                    popupDirectionClass,
                    popupAlignClass,
                  )}
                >
                  <p className="mb-2 text-[11px] font-semibold text-[#0B1F5F]">
                    {getDateLabel(cell.date)}
                  </p>
                  <div className="space-y-1.5">
                    {dayEvents.slice(0, 4).map((event) => (
                      <div
                        key={`popup-${key}-${event.id}`}
                        className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-2"
                      >
                        <div className="mb-1 flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: getEventColor(event) }}
                          />
                          <p className="truncate text-[11px] font-semibold text-slate-800">
                            {event.title}
                          </p>
                        </div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">
                          {event.type.replaceAll("_", " ")}
                        </p>
                        {event.description ? (
                          <p className="mt-1 line-clamp-2 text-[10px] text-slate-600">
                            {event.description}
                          </p>
                        ) : null}
                        {event.meetLink && isGoogleMeetUrl(event.meetLink) ? (
                          <a
                            href={event.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex text-[10px] font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
                          >
                            Join Google Meet
                          </a>
                        ) : null}
                      </div>
                    ))}
                    {dayEvents.length > 4 ? (
                      <p className="text-[10px] font-medium text-slate-500">
                        +{dayEvents.length - 4} more
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
