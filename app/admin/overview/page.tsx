import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  formatCountryName,
  formatHours,
  getOverviewPageData,
  getCountryFlagClass,
  kpiValue,
  reasonBadgeClass,
  roleBadgeClass,
  roleBadgeVariant,
  type Role,
} from "./overview-utils";
import { formatUserRoleLabel } from "@/lib/user/role-label";
import { requireAdminPermission } from "@/lib/auth/guards";

export default async function OverviewPage() {
  await requireAdminPermission("attendance:review");
  const {
    onlineToday,
    notActiveToday,
    alerts,
    alertCount,
    onlineCount,
    notActiveCount,
    pendingRequestCount,
  } = await getOverviewPageData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Attendance snapshot for today (online, not active, and alerts).
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/admin/attendance">Attendance</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/requests" className="flex items-center gap-2">
              HR Requests
              {pendingRequestCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold leading-none text-white">
                  {pendingRequestCount}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Online Today</CardTitle>
            <CardDescription>Checked in and not checked out</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {kpiValue(onlineCount)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Not Active Today</CardTitle>
            <CardDescription>No check-in recorded</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {kpiValue(notActiveCount)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alerts</CardTitle>
            <CardDescription>No activity for 2+ days</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {kpiValue(alertCount)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Attendance test</CardTitle>
            <CardDescription>Today's workforce status</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="online" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="online">
                  Online Today{" "}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({onlineCount})
                  </span>
                </TabsTrigger>
                <TabsTrigger value="not-active">
                  Not Active{" "}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({notActiveCount})
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="online" className="mt-4">
                <div className="rounded-md border">
                  <ScrollArea className="h-[360px] w-full">
                    <Table className="min-w-[720px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Check In</TableHead>
                          <TableHead>Check Out</TableHead>
                          <TableHead className="text-right">
                            Productivity
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {onlineToday.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">
                              {row.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={roleBadgeVariant(row.role)}
                                className={roleBadgeClass(row.role)}
                              >
                                {formatUserRoleLabel(row.role)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span
                                className="inline-flex items-center gap-2"
                                title={formatCountryName(row.country)}
                                aria-label={formatCountryName(row.country)}
                              >
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                                  <span
                                    aria-hidden="true"
                                    className={`${getCountryFlagClass(row.country)} overflow-hidden rounded-sm shadow-sm`}
                                  />
                                </span>
                                <span className="text-sm">
                                  {formatCountryName(row.country)}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell>{row.checkInAt ?? "-"}</TableCell>
                            <TableCell>
                              {row.checkOutAt ?? (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatHours(row.workingHours)}
                            </TableCell>
                          </TableRow>
                        ))}

                        {onlineToday.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="py-10 text-center text-muted-foreground"
                            >
                              No one is online yet today.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="not-active" className="mt-4">
                <div className="rounded-md border">
                  <ScrollArea className="h-[360px] w-full">
                    <Table className="min-w-[680px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {notActiveToday.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">
                              {row.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={roleBadgeVariant(row.role)}
                                className={roleBadgeClass(row.role)}
                              >
                                {formatUserRoleLabel(row.role)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span
                                className="inline-flex items-center gap-2"
                                title={formatCountryName(row.country)}
                                aria-label={formatCountryName(row.country)}
                              >
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                                  <span
                                    aria-hidden="true"
                                    className={`${getCountryFlagClass(row.country)} overflow-hidden rounded-sm shadow-sm`}
                                  />
                                </span>
                                <span className="text-sm">
                                  {formatCountryName(row.country)}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={reasonBadgeClass(row.reason)}
                                variant="secondary"
                              >
                                {row.reason}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {row.leaveNote ?? "-"}
                            </TableCell>
                          </TableRow>
                        ))}

                        {notActiveToday.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="py-10 text-center text-muted-foreground"
                            >
                              Everyone has checked in today.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Alerts</CardTitle>
            <CardDescription>
              Employees missing check-in/out for 2+ days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <AlertTitle className="flex flex-wrap items-center gap-3">
                <span>Action needed</span>
                <div className="text-3xl font-semibold">
                  {kpiValue(alertCount)}
                </div>

                <div
                  className={
                    "rounded-full px-3 py-1 text-xs font-semibold sm:ml-auto " +
                    (alertCount > 0
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700")
                  }
                >
                  {alertCount > 0 ? "Action needed" : "All good"}
                </div>
              </AlertTitle>
              <AlertDescription className="text-sm text-muted-foreground">
                Only alert employees with no activity and no approved leave or
                public holiday.
              </AlertDescription>
            </Alert>

            <div className="rounded-md border">
              <ScrollArea className="h-[280px]">
                <div className="space-y-2 p-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{alert.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge
                            variant={roleBadgeVariant(alert.role as Role)}
                            className={roleBadgeClass(alert.role as Role)}
                          >
                            {formatUserRoleLabel(alert.role)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {alert.country}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Last activity:{" "}
                          <span className="font-medium">
                            {alert.lastActivity}
                          </span>{" "}
                          | Missing:{" "}
                          <span
                            className={
                              alert.daysMissing >= 3
                                ? "font-semibold text-red-700"
                                : "font-medium"
                            }
                          >
                            {alert.daysMissing} day
                            {alert.daysMissing === 1 ? "" : "s"}
                          </span>
                        </p>
                      </div>

                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="w-full shrink-0 sm:w-auto"
                      >
                        <Link href={`/admin/employees?userId=${alert.id}`}>
                          View Employee
                        </Link>
                      </Button>
                    </div>
                  ))}

                  {alerts.length === 0 && (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      No alerts.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
