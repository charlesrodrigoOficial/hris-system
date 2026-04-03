"use client";

import { useMemo, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OrgNode } from "@/lib/build-org-tree";
import { cn } from "@/lib/utils";

type Props = {
  node: OrgNode;
  onSelect: (user: OrgNode) => void;
  editMode?: boolean;
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

function mergeRefs<T>(
  ...refs: Array<((node: T | null) => void) | undefined>
): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      ref?.(node);
    }
  };
}

export default function OrgNodeCard({
  node,
  onSelect,
  editMode = false,
  depth = 0,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  const displayName = node.fullName || node.name || node.email;
  const reportsCount = editMode
    ? node.children.length
    : (node._count?.directReports ?? node.children.length);
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const hasChildren = node.children.length > 0;
  const isChild = depth > 0;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: node.id,
    disabled: !editMode,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: node.id,
    disabled: !editMode,
  });

  const setNodeRef = useMemo(
    () => mergeRefs<HTMLDivElement>(setDragRef as any, setDropRef as any),
    [setDragRef, setDropRef],
  );

  const style = editMode
    ? {
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? undefined : "transform 200ms ease",
      }
    : undefined;

  return (
    <div className="flex flex-col items-center">
      <Card
        ref={setNodeRef}
        style={style}
        onClick={() => {
          if (editMode) return;
          onSelect(node);
        }}
        {...(editMode ? attributes : {})}
        {...(editMode ? listeners : {})}
        className={cn(
          "relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md",
          isChild ? "w-[230px]" : "w-[260px]",
          editMode && "touch-none select-none cursor-grab active:cursor-grabbing",
          editMode && isOver && "ring-2 ring-primary ring-offset-2",
          isDragging && "opacity-70",
        )}
      >
        <div
          className={cn(
            "absolute left-0 top-0 h-1.5 w-full",
            roleAccentClass(node.role),
          )}
        />

        {!editMode ? null : (
          <div
            className={cn(
              "pointer-events-none absolute left-4 top-4 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm",
              isChild ? "h-8 w-8" : "h-9 w-9",
            )}
            aria-hidden="true"
          >
            <GripVertical className="h-4 w-4 text-slate-600" />
          </div>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(node);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className={cn(
            "absolute right-4 top-4 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50",
            isChild ? "h-8 w-8" : "h-9 w-9",
          )}
          aria-label="Open profile"
        >
          <MoreHorizontal className="h-4 w-4 text-slate-600" />
        </button>

        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "relative shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100",
                isChild ? "h-10 w-10" : "h-12 w-12",
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
                  isChild ? "text-sm" : "text-base",
                )}
              >
                {displayName}
              </h3>

              <p
                className={cn(
                  "mt-1 truncate font-medium text-slate-600",
                  "text-xs",
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

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full px-2.5 py-0.5 text-[11px]"
            >
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
            onPointerDown={(event) => event.stopPropagation()}
            className={cn(
              "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 font-medium text-slate-700 transition-colors hover:bg-slate-100",
              isChild ? "px-3 py-2 text-xs" : "px-3 py-2.5 text-xs",
            )}
          >
            {!hasChildren ? (
              "View profile"
            ) : expanded ? (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Collapse team
              </>
            ) : (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                Expand team
              </>
            )}
          </button>
        </CardContent>
      </Card>

      {expanded && hasChildren && (
        <div className="flex w-full flex-col items-center">
          <div className="h-5 w-px bg-slate-300" />

          <div className="relative flex flex-wrap items-start justify-center gap-x-4 gap-y-6 px-2 pt-5">
            {node.children.length > 1 && (
              <div className="absolute left-8 right-8 top-0 h-px bg-slate-300" />
            )}

            {node.children.map((child) => (
              <div
                key={child.id}
                className="relative flex flex-col items-center pt-5"
              >
                <div className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-slate-300" />
                <OrgNodeCard
                  node={child}
                  onSelect={onSelect}
                  editMode={editMode}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
