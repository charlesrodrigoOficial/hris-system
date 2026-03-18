import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "PROCESSING":
      return "default" as const;
    case "CONFIRMED":
      return "outline" as const;
    case "WAITING_FOR_REVIEW":
    default:
      return "secondary" as const;
  }
}

export default async function ScorecardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const employee = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      fullName: true,
      name: true,
      performanceReviews: {
        orderBy: { month: "desc" },
        take: 6,
        select: {
          id: true,
          month: true,
          status: true,
          score: true,
          notes: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <Card className="rounded-2xl border-slate-200 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>Score Card</CardTitle>
          <CardDescription>
            Recent performance review history for{" "}
            {employee?.fullName ?? employee?.name ?? session.user.name ?? "Employee"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!employee || employee.performanceReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No scorecards are available yet.
            </p>
          ) : (
            employee.performanceReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{formatMonth(review.month)}</p>
                    <p className="text-sm text-muted-foreground">
                      Status: {formatStatus(review.status)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={statusBadgeVariant(review.status)}>
                      {formatStatus(review.status)}
                    </Badge>
                    <div className="text-sm font-medium">
                      Score:{" "}
                      {review.score !== null ? Number(review.score).toFixed(2) : "-"}
                    </div>
                  </div>
                </div>

                {review.notes ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {review.notes}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
