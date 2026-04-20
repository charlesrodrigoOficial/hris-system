import { AttendanceStatus, Country, UserRole } from "@prisma/client";

export type CalendarEventType =
  | "EVENT"
  | "HOLIDAY"
  | "MEETING"
  | "PAYROLL"
  | "SHIFT"
  | "ANNOUNCEMENT"
  | "BIRTHDAY"
  | "LEAVE"
  | "ATTENDANCE";

export type CalendarEventSource =
  | "calendar_item"
  | "birthday"
  | "leave"
  | "attendance";

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  meetLink?: string | null;
  type: CalendarEventType;
  source: CalendarEventSource;
  start: string;
  end: string;
  allDay: boolean;
  color?: string | null;
  userId?: string | null;
  departmentId?: string | null;
  country?: Country | null;
  meta?: Record<string, unknown>;
};

export type Viewer = {
  id: string;
  role: UserRole;
  departmentId?: string | null;
  country?: Country | null;
};

export type GetCalendarEventsFilters = {
  userId?: string;
  departmentId?: string;
  country?: Country;
  includeAttendance?: boolean;
};

export type GetCalendarEventsParams = {
  start: Date | string;
  end: Date | string;
  viewer: Viewer;
  filters?: GetCalendarEventsFilters;
};

export type CalendarAttendanceRow = {
  id: string;
  date: Date;
  status: AttendanceStatus;
  workMode: string;
  checkIn: Date | null;
  checkOut: Date | null;
  userId: string;
  user: {
    id: string;
    name: string | null;
    fullName: string | null;
    departmentId: string | null;
    country: Country | null;
  };
};
