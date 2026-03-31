"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OrgNode } from "@/lib/build-org-tree";
import { cn } from "@/lib/utils";

type Props = {
  node: OrgNode;
  onSelect: (user: OrgNode) => void;
  depth?: number;
};

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function roleAccentClass(role?: string | null) {
  switch (String(role ?? "").toUpperCase()) {
    case "ADMIN":
      return "bg-gradient-to-r from-violet-500 to-sky-500";
    case "HR":
      return "bg-gradient-to-r from-emerald-500 to-teal-500";
    case "MANAGER":
      return "bg-gradient-to-r from-amber-500 to-orange-500";
    case "FINANCE":
      return "bg-gradient-to-r from-emerald-600 to-lime-500";
    case "EMPLOYEE":
      return "bg-gradient-to-r from-slate-500 to-slate-400";
    default:
      return "bg-gradient-to-r from-slate-400 to-slate-300";
  }
}

function roleBadgeClass(role?: string | null) {
  switch (String(role ?? "").toUpperCase()) {
    case "ADMIN":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "HR":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "MANAGER":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "FINANCE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "EMPLOYEE":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function OrgNodeCard({ node, onSelect, depth = 0 }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  const displayName = node.fullName || node.name || node.email;
  const reportsCount = node._count?.directReports ?? node.children.length;
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const hasChildren = node.children.length > 0;
  const isChild = depth > 0;

  return (
    <div className="flex flex-col items-center">
      <Card
        onClick={() => onSelect(node)}
        className={cn(
          "relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md",
          isChild ? "w-[300px]" : "w-[340px]",
        )}
      >
        <div
          className={cn(
            "absolute left-0 top-0 h-1.5 w-full",
            roleAccentClass(node.role),
          )}
        />

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(node);
          }}
          className={cn(
            "absolute right-4 top-4 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50",
            isChild ? "h-9 w-9" : "h-10 w-10",
          )}
          aria-label="Open profile"
        >
          <MoreHorizontal className="h-5 w-5 text-slate-600" />
        </button>

        <CardContent className={cn(isChild ? "p-5" : "p-6")}>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "relative shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100",
                isChild ? "h-14 w-14" : "h-16 w-16",
              )}
            >
              {node.image && !imageFailed ? (
                <img
                  src={node.image}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-700">
                  {initials}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 text-left">
              <h3
                className={cn(
                  "truncate font-semibold text-slate-900",
                  isChild ? "text-base" : "text-lg",
                )}
              >
                {displayName}
              </h3>

              <p
                className={cn(
                  "mt-1 truncate font-medium text-slate-600",
                  isChild ? "text-[13px]" : "text-sm",
                )}
              >
                {node.position || "No position"}
              </p>

              <p
                className={cn(
                  "mt-2 truncate font-semibold tracking-[0.2em] text-slate-400",
                  isChild ? "text-[11px]" : "text-xs",
                )}
              >
                {(node.department?.departmentName || "No department").toUpperCase()}
                {node.branch?.branchName
                  ? ` • ${node.branch.branchName.toUpperCase()}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                roleBadgeClass(node.role),
              )}
            >
              {node.role}
            </Badge>

            <Badge variant="outline" className="rounded-full">
              {reportsCount} reports
            </Badge>

            {node.isActive === false ? (
              <Badge
                variant="outline"
                className="rounded-full border-red-200 bg-red-50 text-red-700"
              >
                Inactive
              </Badge>
            ) : null}
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (!hasChildren) {
                onSelect(node);
                return;
              }
              setExpanded((prev) => !prev);
            }}
            className={cn(
              "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 font-medium text-slate-700 transition-colors hover:bg-slate-100",
              isChild ? "px-4 py-2.5 text-[13px]" : "px-4 py-3 text-sm",
            )}
          >
            {!hasChildren ? (
              "View profile"
            ) : expanded ? (
              <>
                <ChevronDown className="h-4 w-4" />
                Collapse team
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4" />
                Expand team
              </>
            )}
          </button>
        </CardContent>
      </Card>

      {expanded && hasChildren && (
        <div className="flex w-full flex-col items-center">
          <div className="h-6 w-px bg-slate-300" />

          <div className="relative flex flex-wrap items-start justify-center gap-x-6 gap-y-8 px-3 pt-6">
            {node.children.length > 1 && (
              <div className="absolute left-10 right-10 top-0 h-px bg-slate-300" />
            )}

            {node.children.map((child) => (
              <div
                key={child.id}
                className="relative flex flex-col items-center pt-6"
              >
                <div className="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 bg-slate-300" />
                <OrgNodeCard node={child} onSelect={onSelect} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

