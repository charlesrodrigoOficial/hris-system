import { Metadata } from "next";
import { Volume2 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata: Metadata = {
  title: "Profile",
};

function formatEnum(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatName(
  fullName?: string | null,
  name?: string | null,
  firstName?: string | null,
  lastName?: string | null,
) {
  const fromParts = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fromParts || fullName || name || "Employee";
}

function initialsFromName(name: string) {
  const [a = "", b = ""] = name.trim().split(/\s+/);
  return `${a.charAt(0)}${b.charAt(0)}`.toUpperCase() || "U";
}

function formatDate(value?: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function getMonthDiff(startDate?: Date | null) {
  if (!startDate) return null;
  const start = new Date(startDate);
  const now = new Date();

  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());

  if (now.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

function formatTenureShort(startDate?: Date | null) {
  const months = getMonthDiff(startDate);
  if (months == null) return "-";
  if (months < 1) return "Less than a month";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;

  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (!remMonths) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years} year${years === 1 ? "" : "s"} ${remMonths} month${remMonths === 1 ? "" : "s"}`;
}

function formatTenureLong(startDate?: Date | null) {
  if (!startDate) return "-";
  const start = new Date(startDate);
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(
    0,
    Math.floor((now.getTime() - start.getTime()) / msPerDay),
  );
  const months = Math.floor(days / 30);
  const remDays = days % 30;

  if (months === 0) return `${remDays} day${remDays === 1 ? "" : "s"}`;
  return `${months} month${months === 1 ? "" : "s"} ${remDays} day${remDays === 1 ? "" : "s"}`;
}

function Field({
  label,
  value,
  subValue,
  valueClassName,
}: {
  label: string;
  value: string;
  subValue?: string;
  valueClassName?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-lg font-semibold leading-tight text-[#0F172A] md:text-xl">
        {label}
      </p>
      <p className={valueClassName ?? "text-[11px] leading-snug text-slate-700 md:text-xs"}>
        {value}
      </p>
      {subValue ? <p className="text-[11px] text-slate-500">{subValue}</p> : null}
    </div>
  );
}

export default async function Profile() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      fullName: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
      isActive: true,
      officeLocation: true,
      country: true,
      phoneNo: true,
      hireDate: true,
      employmentType: true,
      manager: {
        select: {
          name: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      directReports: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          name: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
          position: true,
        },
      },
      _count: {
        select: {
          directReports: true,
        },
      },
    },
  });

  const displayName = formatName(
    user?.fullName,
    user?.name ?? session.user.name,
    user?.firstName,
    user?.lastName,
  );

  const reportsToLabel = user?.manager
    ? formatName(
        user.manager.fullName,
        user.manager.name,
        user.manager.firstName,
        user.manager.lastName,
      )
    : "-";

  const directReport = user?.directReports?.[0];
  const directReportName = directReport
    ? formatName(
        directReport.fullName,
        directReport.name,
        directReport.firstName,
        directReport.lastName,
      )
    : "-";

  const directReportRole = directReport?.position
    ? formatEnum(directReport.position)
    : "";

  const locationLabel =
    user?.officeLocation || formatEnum(user?.country) || "Location not set";
  const activeBadge = user?.isActive ? "Employed (Active)" : "Not active";
  const employmentLabel = formatEnum(user?.employmentType) || "-";
  const startDateLabel = formatDate(user?.hireDate);
  const positionDuration = formatTenureShort(user?.hireDate);
  const tenureDuration = formatTenureLong(user?.hireDate);
  const directReportsCount = user?._count.directReports ?? 0;

  return (
    <section className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar className="h-28 w-28 border border-[#BFDBFE] sm:h-32 sm:w-32">
            <AvatarImage src={user?.image ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-[#DBEAFE] text-[#0B1F5F]">
              {initialsFromName(displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-5xl font-semibold leading-none text-[#0F172A] sm:text-6xl">
                {displayName}
              </h1>
              <Volume2 className="h-5 w-5 text-slate-500" />
            </div>

            <p className="mt-2 text-sm text-slate-600">{locationLabel}</p>

            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#F1F5F9] px-3 py-1.5 text-sm text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              {activeBadge}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Reports to" value={reportsToLabel} />
          <Field
            label="Direct reports"
            value={directReportName}
            subValue={
              directReportName !== "-"
                ? `${directReportRole || "Employee"}${directReportsCount > 1 ? ` (${directReportsCount} total)` : ""}`
                : undefined
            }
          />
          <Field label="Employment contract" value={employmentLabel} />

          <Field label="Employment type" value={employmentLabel} />
          <Field label="Time in current position" value={positionDuration} />
          <Field label="Start date" value={startDateLabel} />

          <Field label="Accumulated tenure (duration)" value={tenureDuration} />
          <Field
            label="Email"
            value={user?.email ?? session.user.email ?? "-"}
            valueClassName="text-[11px] leading-snug text-[#C46A19] md:text-xs"
          />
          <Field label="Work phone" value={user?.phoneNo ?? "-"} />

          <Field label="Work mobile" value="-" />
          <Field label="Personal mobile" value="-" />
          <Field label="Personal phone" value="-" />
        </div>
      </div>
    </section>
  );
}
