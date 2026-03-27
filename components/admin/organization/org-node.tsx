"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OrgNode } from "@/lib/build-org-tree";

type Props = {
  node: OrgNode;
  onSelect: (user: OrgNode) => void;
};

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function OrgNodeCard({ node, onSelect }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  const displayName = node.fullName || node.name || node.email;
  const reportsCount = node._count?.directReports ?? node.children.length;
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  return (
    <div className="flex flex-col items-center">
      <Card
        onClick={() => onSelect(node)}
        className="w-[280px] rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
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
              <h3 className="truncate text-sm font-semibold text-slate-900">
                {displayName}
              </h3>

              <p className="mt-1 truncate text-xs font-medium text-slate-600">
                {node.position || "No position"}
              </p>

              <p className="mt-1 truncate text-xs text-slate-500">
                {node.department?.departmentName || "No department"}
                {node.branch?.branchName ? ` • ${node.branch.branchName}` : ""}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              {node.role}
            </Badge>

            <Badge variant="outline" className="rounded-full">
              {reportsCount} reports
            </Badge>
          </div>

          {node.children.length > 0 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setExpanded((prev) => !prev);
              }}
              className="mt-4 inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {expanded ? "Collapse team" : "Expand team"}
            </button>
          )}
        </CardContent>
      </Card>

      {expanded && node.children.length > 0 && (
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
                <OrgNodeCard node={child} onSelect={onSelect}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
