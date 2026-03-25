"use server";

import { revalidatePath } from "next/cache";
import {
  CalendarItemType,
  CalendarVisibility,
  Country,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/db/prisma";

const createCalendarItemSchema = z
  .object({
    title: z.string().trim().min(2, "Title is required."),
    description: z.string().trim().optional().nullable(),
    type: z.nativeEnum(CalendarItemType),
    visibility: z.nativeEnum(CalendarVisibility),
    startDate: z.string().min(1, "Start date is required."),
    endDate: z.string().min(1, "End date is required."),
    allDay: z.boolean(),
    color: z.string().trim().optional().nullable(),
    country: z.nativeEnum(Country).optional().nullable(),
    departmentId: z.string().uuid().optional().nullable(),
    userId: z.string().uuid().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Start date is invalid.",
      });
    }

    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date is invalid.",
      });
    }

    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end < start
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date cannot be before start date.",
      });
    }
  });

export type CreateCalendarItemState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

function normalizeOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

function normalizeDateTime(value: string, allDay: boolean, isEnd: boolean) {
  if (!value) return value;

  // For <input type="date" />
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return allDay
      ? `${value}${isEnd ? "T23:59:59.999Z" : "T00:00:00.000Z"}`
      : `${value}${isEnd ? "T17:00:00.000Z" : "T09:00:00.000Z"}`;
  }

  // For <input type="datetime-local" />
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return `${value}:00Z`;
  }

  return value;
}

export async function createCalendarItemAction(
  _prevState: CreateCalendarItemState,
  formData: FormData,
): Promise<CreateCalendarItemState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "You must be signed in.",
    };
  }

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      departmentId: true,
      country: true,
    },
  });

  if (!viewer) {
    return {
      ok: false,
      message: "User not found.",
    };
  }

  const allDay = normalizeBoolean(formData.get("allDay"));

  const rawData = {
    title: formData.get("title"),
    description: normalizeOptionalString(formData.get("description")),
    type: formData.get("type"),
    visibility: formData.get("visibility"),
    startDate: normalizeDateTime(
      String(formData.get("startDate") ?? ""),
      allDay,
      false,
    ),
    endDate: normalizeDateTime(
      String(formData.get("endDate") ?? ""),
      allDay,
      true,
    ),
    allDay,
    color: normalizeOptionalString(formData.get("color")),
    country: normalizeOptionalString(formData.get("country")),
    departmentId: normalizeOptionalString(formData.get("departmentId")),
    userId: normalizeOptionalString(formData.get("userId")),
  };

  const parsed = createCalendarItemSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the form errors.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  const isAdminLike =
    viewer.role === UserRole.ADMIN || viewer.role === UserRole.HR;
  const isManager = viewer.role === UserRole.MANAGER;

  if (!isAdminLike && !isManager) {
    return {
      ok: false,
      message: "You do not have permission to create calendar events.",
    };
  }

  let finalVisibility = data.visibility;
  let finalDepartmentId = data.departmentId ?? null;
  let finalUserId = data.userId ?? null;
  let finalCountry = data.country ?? null;

  if (isManager) {
    if (data.visibility === CalendarVisibility.COMPANY) {
      return {
        ok: false,
        message: "Managers cannot create company-wide events.",
      };
    }

    if (data.visibility === CalendarVisibility.DEPARTMENT) {
      if (!viewer.departmentId) {
        return {
          ok: false,
          message: "No department is assigned to your account.",
        };
      }

      finalDepartmentId = viewer.departmentId;
      finalUserId = null;
    }

    if (data.visibility === CalendarVisibility.PERSONAL) {
      finalUserId = viewer.id;
      finalDepartmentId = null;
    }
  }

  if (isAdminLike) {
    if (data.visibility === CalendarVisibility.COMPANY) {
      finalDepartmentId = null;
      finalUserId = null;
    }

    if (data.visibility === CalendarVisibility.DEPARTMENT) {
      finalUserId = null;

      if (!finalDepartmentId) {
        return {
          ok: false,
          message: "Department is required for department events.",
          errors: {
            departmentId: ["Department is required."],
          },
        };
      }
    }

    if (data.visibility === CalendarVisibility.PERSONAL) {
      finalDepartmentId = null;

      if (!finalUserId) {
        finalUserId = viewer.id;
      }
    }
  }

  try {
    await prisma.calendarItem.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        visibility: finalVisibility,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        allDay: data.allDay,
        color: data.color,
        country: finalCountry,
        departmentId: finalDepartmentId,
        userId: finalUserId,
        createdById: viewer.id,
      },
    });

    revalidatePath("/admin/calendar");

    return {
      ok: true,
      message: "Calendar event created successfully.",
    };
  } catch (error) {
    console.error("createCalendarItemAction error", error);

    return {
      ok: false,
      message: "Failed to create calendar event.",
    };
  }
}
