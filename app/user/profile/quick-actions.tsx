// components/admin/quick-actions.tsx
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, MessageSquareText, Table2, Wallet } from "lucide-react";

type QuickAction = {
  title: string;
  href: string;
  cta: string;
  Icon: React.ElementType;
};

const actions: QuickAction[] = [
  {
    title: "Payrolls",
    href: "/admin/payrolls",
    cta: "GO TO PAYMENTS",
    Icon: Wallet,
  },
  {
    title: "Attendance",
    href: "/admin/attendance",
    cta: "GO TO ATTENDANCE",
    Icon: Table2,
  },
  {
    title: "Calendar",
    href: "/admin/calendar",
    cta: "GO TO CALENDAR",
    Icon: CalendarDays,
  },
  {
    title: "Support",
    href: "/user/requests",
    cta: "GO TO REQUESTS",
    Icon: MessageSquareText,
  },
];

export function QuickActions() {
  return (
    <Card className="rounded-2xl border-0 bg-blue-600 p-6 shadow-sm">
      <h2 className="text-3xl font-semibold tracking-tight text-white">
        Quick Actions
      </h2>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map(({ title, href, cta, Icon }) => (
          <Card
            key={title}
            className="rounded-2xl border-0 bg-blue-900 p-8 shadow-sm"
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600">
                <Icon className="h-10 w-10 text-white" />
              </div>

              <h3 className="mt-6 text-2xl font-semibold text-white">
                {title}
              </h3>

              <Button
                asChild
                variant="link"
                className="mt-4 text-white hover:text-white"
              >
                <Link href={href} className="flex items-center gap-2">
                  {cta} <span aria-hidden>→</span>
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}
