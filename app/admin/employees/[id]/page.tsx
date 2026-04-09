import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Building2,
  CalendarCheck,
  FileText,
  Goal,
  ScrollText,
  UserRound,
  Users,
} from "lucide-react";
import { requireAdminPermission } from "@/lib/auth/guards";
import { formatUserRoleLabel } from "@/lib/user/role-label";
import { hasPermission, isSuperAdmin } from "@/lib/auth/rbac";

function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function SectionCard({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-24 rounded-3xl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default async function AdminEmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdminPermission("org:manage");
  const actorRole = session.user.role;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      name: true,
      email: true,
      role: true,
      image: true,
      isActive: true,
      hireDate: true,
      employmentType: true,
      position: true,
      orgLevel: true,
      country: true,
      officeLocation: true,
      department: { select: { departmentName: true } },
      branch: { select: { branchName: true } },
      manager: {
        select: { id: true, fullName: true, name: true, email: true, position: true },
      },
      directReports: {
        select: { id: true, fullName: true, name: true, email: true, position: true },
        orderBy: [{ fullName: "asc" }, { name: "asc" }],
        take: 8,
      },
      _count: { select: { directReports: true } },
      // payroll fields (only show to Super Admin here)
      salary: true,
      accountName: true,
      accountNumber: true,
      swiftCode: true,
      iban: true,
      sortCode: true,
    },
  });

  if (!user) return notFound();

  const displayName = user.fullName ?? user.name ?? user.email;
  const initials = getInitials(displayName);
  const canSeePayroll =
    isSuperAdmin(actorRole) || hasPermission(actorRole, "users:edit_payroll");

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white/80 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-muted">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                    {initials || "?"}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold">{displayName}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatUserRoleLabel(user.role)}{" "}
                  {user.position ? `• ${user.position}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {user.isActive ? "Employed" : "Inactive"}
                  </Badge>
                  {user.department?.departmentName ? (
                    <Badge variant="outline">{user.department.departmentName}</Badge>
                  ) : null}
                  {user.branch?.branchName ? (
                    <Badge variant="outline">{user.branch.branchName}</Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button asChild variant="outline">
                <Link href="/admin/organization">Org chart</Link>
              </Button>

              <Button asChild variant="outline">
                <Link href={`/admin/employees/${user.id}/edit`}>Edit profile</Link>
              </Button>

              {isSuperAdmin(actorRole) ? (
                <Button asChild>
                  <Link href={`/admin/users/${user.id}`}>User & role</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryItem label="Email" value={user.email} />
            <SummaryItem
              label="Reports to"
              value={
                user.manager ? (
                  <Link
                    href={`/admin/employees/${user.manager.id}`}
                    className="underline underline-offset-2"
                  >
                    {user.manager.fullName ?? user.manager.name ?? user.manager.email}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            <SummaryItem
              label="Direct reports"
              value={user._count?.directReports ? String(user._count.directReports) : "0"}
            />
            <SummaryItem label="Start date" value={formatDate(user.hireDate)} />
            <SummaryItem label="Office" value={user.officeLocation ?? "—"} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="#employment" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Employment
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="#payroll" className="flex items-center gap-2">
                <ScrollText className="h-4 w-4" />
                Payroll
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/attendance" className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" />
                Attendance
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/requests" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Requests
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/departments" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Departments
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="#people" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                People
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" disabled>
              <span className="flex items-center gap-2">
                <Goal className="h-4 w-4" />
                Goals (soon)
              </span>
            </Button>
            <Button asChild variant="ghost" size="sm" disabled>
              <span className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                Performance (soon)
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card className="h-fit rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">Sections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="#employment">Employment</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="#payroll">Payroll</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="#people">People</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <SectionCard id="employment" title="Employment">
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryItem
                label="Employment type"
                value={user.employmentType ? String(user.employmentType) : "—"}
              />
              <SummaryItem label="Org level" value={user.orgLevel ?? "—"} />
              <SummaryItem label="Position" value={user.position ?? "—"} />
              <SummaryItem label="Country" value={user.country ? String(user.country) : "—"} />
            </div>
          </SectionCard>

          <SectionCard id="payroll" title="Payroll">
            {!canSeePayroll ? (
              <p className="text-sm text-muted-foreground">
                Payroll data is restricted. Only Super Admin and Payroll Admin can
                view or manage compensation details.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <SummaryItem
                  label="Salary"
                  value={user.salary ? user.salary.toString() : "—"}
                />
                <SummaryItem label="Account name" value={user.accountName ?? "—"} />
                <SummaryItem
                  label="Account number"
                  value={user.accountNumber ? "••••••••" : "—"}
                />
                <SummaryItem label="SWIFT" value={user.swiftCode ?? "—"} />
                <SummaryItem label="IBAN" value={user.iban ? "••••••••" : "—"} />
                <SummaryItem label="Sort code" value={user.sortCode ?? "—"} />
              </div>
            )}
          </SectionCard>

          <SectionCard id="people" title="People">
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryItem
                label="Manager"
                value={
                  user.manager ? (
                    <Link
                      href={`/admin/employees/${user.manager.id}`}
                      className="underline underline-offset-2"
                    >
                      {user.manager.fullName ?? user.manager.name ?? user.manager.email}
                    </Link>
                  ) : (
                    "Top level / No manager"
                  )
                }
              />
              <SummaryItem
                label="Direct reports"
                value={user._count?.directReports ? String(user._count.directReports) : "0"}
              />
            </div>

            {user.directReports.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {user.directReports.map((report) => {
                  const label = report.fullName ?? report.name ?? report.email;
                  return (
                    <Link
                      key={report.id}
                      href={`/admin/employees/${report.id}`}
                      className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      <span className="truncate font-medium">{label}</span>
                      <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                        {report.position ?? "—"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No direct reports.</p>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
