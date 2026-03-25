"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  createCalendarItemAction,
  type CreateCalendarItemState,
} from "@/lib/actions/calendar.actions";

type DepartmentOption = {
  id: string;
  name: string;
};

type UserOption = {
  id: string;
  name: string;
  departmentId?: string | null;
};

type Props = {
  departments?: DepartmentOption[];
  users?: UserOption[];
  canCreateCompanyEvents?: boolean;
};

const INITIAL_STATE: CreateCalendarItemState = {
  ok: false,
  message: "",
};

const TYPE_OPTIONS = [
  "EVENT",
  "HOLIDAY",
  "MEETING",
  "PAYROLL",
  "SHIFT",
  "ANNOUNCEMENT",
] as const;

const TYPE_COLORS: Record<(typeof TYPE_OPTIONS)[number], string> = {
  EVENT: "#3b82f6",
  HOLIDAY: "#0ea5e9",
  MEETING: "#8b5cf6",
  PAYROLL: "#22c55e",
  SHIFT: "#f97316",
  ANNOUNCEMENT: "#ec4899",
};

const VISIBILITY_OPTIONS = ["COMPANY", "DEPARTMENT", "PERSONAL"] as const;

const COUNTRY_OPTIONS = [
  "UNITED_KINGDOM",
  "PAKISTAN",
  "MALAYSIA",
  "INDIA",
  "SRI_LANKA",
  "BANGLADESH",
  "USA",
  "CANADA",
  "AUSTRALIA",
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating..." : "Create event"}
    </button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;

  return <p className="mt-1 text-xs text-red-600">{errors[0]}</p>;
}

function formatCountryLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function CreateCalendarItemModal({
  departments = [],
  users = [],
  canCreateCompanyEvents = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [allDay, setAllDay] = useState(true);
  const [eventType, setEventType] =
    useState<(typeof TYPE_OPTIONS)[number]>("EVENT");
  const [color, setColor] = useState(TYPE_COLORS.EVENT);
  const [visibility, setVisibility] = useState<
    "COMPANY" | "DEPARTMENT" | "PERSONAL"
  >(canCreateCompanyEvents ? "COMPANY" : "DEPARTMENT");

  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useActionState(
    createCalendarItemAction,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setAllDay(true);
      setEventType("EVENT");
      setColor(TYPE_COLORS.EVENT);
      setVisibility(canCreateCompanyEvents ? "COMPANY" : "DEPARTMENT");
      setOpen(false);
    }
  }, [state.ok, canCreateCompanyEvents]);

  const filteredUsers = useMemo(() => {
    if (visibility !== "DEPARTMENT") return users;
    return users;
  }, [users, visibility]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        + Add Event
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Create calendar event
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Add a manual calendar item for company, department, or
                  personal use.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form
              ref={formRef}
              action={formAction}
              className="space-y-4 px-5 py-5"
            >
              {state.message ? (
                <div
                  className={`rounded-2xl border px-4 py-2.5 text-sm ${
                    state.ok
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {state.message}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Title
                  </label>
                  <input
                    name="title"
                    type="text"
                    placeholder="Team meeting, Payroll run, Office holiday..."
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  />
                  <FieldError errors={state.errors?.title} />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Optional details about the event"
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  />
                  <FieldError errors={state.errors?.description} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Type
                  </label>
                  <select
                    name="type"
                    value={eventType}
                    onChange={(e) => {
                      const nextType = e.target.value as (typeof TYPE_OPTIONS)[number];
                      setEventType(nextType);
                      setColor(TYPE_COLORS[nextType]);
                    }}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {formatCountryLabel(option)}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={state.errors?.type} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Visibility
                  </label>
                  <select
                    name="visibility"
                    value={visibility}
                    onChange={(e) =>
                      setVisibility(
                        e.target.value as "COMPANY" | "DEPARTMENT" | "PERSONAL",
                      )
                    }
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  >
                    {VISIBILITY_OPTIONS.filter(
                      (option) =>
                        canCreateCompanyEvents || option !== "COMPANY",
                    ).map((option) => (
                      <option key={option} value={option}>
                        {formatCountryLabel(option)}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={state.errors?.visibility} />
                </div>

                <div className="flex items-center gap-3 rounded-xl border px-3 py-2.5">
                  <input
                    id="allDay"
                    name="allDay"
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label
                    htmlFor="allDay"
                    className="text-sm font-medium text-slate-700"
                  >
                    All day event
                  </label>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Color
                  </label>
                  <input
                    name="color"
                    type="text"
                    placeholder="#3b82f6"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  />
                  <FieldError errors={state.errors?.color} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Start
                  </label>
                  <input
                    name="startDate"
                    type={allDay ? "date" : "datetime-local"}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  />
                  <FieldError errors={state.errors?.startDate} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    End
                  </label>
                  <input
                    name="endDate"
                    type={allDay ? "date" : "datetime-local"}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  />
                  <FieldError errors={state.errors?.endDate} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Country
                  </label>
                  <select
                    name="country"
                    defaultValue=""
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="">No country filter</option>
                    {COUNTRY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {formatCountryLabel(option)}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={state.errors?.country} />
                </div>

                {visibility === "DEPARTMENT" ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Department
                    </label>
                    <select
                      name="departmentId"
                      defaultValue=""
                      className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                    <FieldError errors={state.errors?.departmentId} />
                  </div>
                ) : (
                  <input name="departmentId" type="hidden" value="" />
                )}

                {visibility === "PERSONAL" ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      User
                    </label>
                    <select
                      name="userId"
                      defaultValue=""
                      className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                    >
                      <option value="">Current user</option>
                      {filteredUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <FieldError errors={state.errors?.userId} />
                  </div>
                ) : (
                  <input name="userId" type="hidden" value="" />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
