"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { canManageAttendance } from "@/lib/auth/roles";
import {
  ClipboardList,
  MessageSquareText,
  Table2,
  Wallet,
  Sparkles,
  Clock3,
} from "lucide-react";

const baseActions = [
  { title: "Payroll", href: "/user/payroll", Icon: Wallet },
  { title: "Time", href: "/user/requests?mode=leave", Icon: Clock3 },
  { title: "Support", href: "/user/requests?mode=support", Icon: MessageSquareText },
];

type QuickActionsProps = {
  className?: string;
  role?: string | null;
};

function getQuickActions(role?: string | null) {
  const attendanceAction = canManageAttendance(role)
    ? { title: "Attendance", href: "/#attendance", Icon: Table2 }
    : { title: "Reviews", href: "/user/reviews", Icon: ClipboardList };

  return [
    baseActions[0],
    attendanceAction,
    baseActions[1],
    baseActions[2],
  ];
}

export function QuickActions({ className, role }: QuickActionsProps) {
  const actions = getQuickActions(role);

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#BFDBFE] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(219,234,254,0.92)_30%,_rgba(191,219,254,0.9)_62%,_rgba(147,197,253,0.9)_100%)] p-4 text-[#0F172A] shadow-[0_18px_44px_-30px_rgba(11,31,95,0.35)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_-36px_rgba(11,31,95,0.4)]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/70 bg-[#DBEAFE]/80 text-[#1D4ED8] shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold bg-gradient-to-r from-[#0B1F5F] via-[#1D4ED8] to-[#1D4ED8] bg-clip-text text-transparent">
            Quick Actions
          </p>
          <p className="text-xs text-[#64748B]">Jump into common tasks</p>
        </div>
      </div>

      {/* Actions grid */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map(({ title, href, Icon }) => (
          <Button
            key={title}
            asChild
            variant="outline"
            className="
              group h-11 flex-col items-center justify-center gap-1
              rounded-xl border border-[#BFDBFE] bg-white/75
              text-xs font-medium text-[#0F172A]
              transition
              hover:-translate-y-1 hover:border-[#93C5FD]
              hover:bg-white hover:shadow
            "
          >
            <Link href={href}>
              <Icon className="h-4 w-4 text-[#64748B] group-hover:text-[#1D4ED8]" />
              {title}
            </Link>
          </Button>
        ))}
      </div>
    </Card>
  );
}

export function QuickActionsCompact({ className, role }: QuickActionsProps) {
  const actions = getQuickActions(role);

  return (
    <div className={cn("mt-2 grid grid-cols-2 gap-3", className)}>
      {actions.map(({ title, href, Icon }) => (
        <Button
          key={title}
          asChild
          variant="outline"
          className="
            group h-11 flex-col items-center justify-center gap-1
            rounded-xl border border-[#BFDBFE] bg-white/75
            text-xs font-medium text-[#0F172A]
            transition
            hover:-translate-y-1 hover:border-[#93C5FD]
            hover:bg-white hover:shadow
          "
        >
          <Link href={href} aria-label={title} title={title}>
            <Icon className="h-4 w-4 text-[#64748B] group-hover:text-[#1D4ED8]" />
            {title}
          </Link>
        </Button>
      ))}
    </div>
  );
}
