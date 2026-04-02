"use client";

import { useMemo, useState, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import OrgNodeCard from "@/components/admin/organization/org-node";
import { buildOrgTree, type OrgUser } from "@/lib/build-org-tree";
import UserProfileSheet from "./user-profile-sheet";

type Props = {
  users: OrgUser[];
  canEdit?: boolean;
};

const ROOT_DROP_ID = "org-root";

function wouldCreateManagerCycle(params: {
  userId: string;
  managerId: string | null;
  userById: Map<string, OrgUser>;
}) {
  const { userId, managerId, userById } = params;
  if (!managerId) return false;
  if (managerId === userId) return true;

  const seen = new Set<string>();
  let current: string | null = managerId;

  while (current) {
    if (current === userId) return true;
    if (seen.has(current)) return true;
    seen.add(current);
    current = userById.get(current)?.managerId ?? null;
  }

  return false;
}

function RootDropZone({ enabled }: { enabled: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: ROOT_DROP_ID,
    disabled: !enabled,
  });

  if (!enabled) return null;

  return (
    <div
      ref={setNodeRef}
      className={
        "mx-auto mb-8 w-full max-w-xl rounded-2xl border border-dashed bg-white/70 p-4 text-center text-sm text-muted-foreground transition " +
        (isOver ? "border-primary bg-primary/5 text-primary" : "border-slate-200")
      }
    >
      Drop here to make top-level (no manager)
    </div>
  );
}

export default function OrganizationClient({ users, canEdit = false }: Props) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [branch, setBranch] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [savingMove, setSavingMove] = useState(false);
  const [localUsers, setLocalUsers] = useState<OrgUser[]>(users);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    // Refresh local state from server when not editing.
    if (!editMode && !savingMove) {
      setLocalUsers(users);
    }
  }, [users, editMode, savingMove]);

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        localUsers
          .map((u) => u.department?.departmentName)
          .filter((v): v is string => Boolean(v))
      )
    ).sort();
  }, [localUsers]);

  const branches = useMemo(() => {
    return Array.from(
      new Set(
        localUsers
          .map((u) => u.branch?.branchName)
          .filter((v): v is string => Boolean(v))
      )
    ).sort();
  }, [localUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    const directlyMatched = localUsers.filter((user) => {
      const matchesSearch =
        !q ||
        (user.fullName || "").toLowerCase().includes(q) ||
        (user.name || "").toLowerCase().includes(q) ||
        (user.email || "").toLowerCase().includes(q) ||
        (user.position || "").toLowerCase().includes(q) ||
        (user.department?.departmentName || "").toLowerCase().includes(q) ||
        (user.branch?.branchName || "").toLowerCase().includes(q);

      const matchesDepartment =
        department === "all" ||
        user.department?.departmentName === department;

      const matchesBranch =
        branch === "all" || user.branch?.branchName === branch;

      return matchesSearch && matchesDepartment && matchesBranch;
    });

    const keepIds = new Set<string>();
    const userMap = new Map(localUsers.map((u) => [u.id, u]));

    for (const user of directlyMatched) {
      keepIds.add(user.id);

      let currentManagerId = user.managerId;
      while (currentManagerId) {
        keepIds.add(currentManagerId);
        currentManagerId = userMap.get(currentManagerId)?.managerId ?? null;
      }
    }

    return localUsers.filter((u) => keepIds.has(u.id));
  }, [localUsers, search, department, branch]);

  const tree = useMemo(() => buildOrgTree(filteredUsers), [filteredUsers]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return localUsers.find((u) => u.id === selectedUserId) ?? null;
  }, [localUsers, selectedUserId]);

  const onDragEnd = async (event: DragEndEvent) => {
    if (!editMode || !canEdit) return;
    if (savingMove) {
      toast({
        variant: "destructive",
        description: "Please wait for the previous change to finish saving.",
      });
      return;
    }

    const activeId = String(event?.active?.id ?? "");
    const overIdRaw = event?.over?.id ? String(event.over.id) : null;

    if (!activeId || !overIdRaw) return;
    if (activeId === overIdRaw) return;

    const newManagerId = overIdRaw === ROOT_DROP_ID ? null : overIdRaw;

    const userById = new Map(localUsers.map((u) => [u.id, u]));
    const activeUser = userById.get(activeId);
    if (!activeUser) return;

    if (activeUser.managerId === newManagerId) return;

    if (
      wouldCreateManagerCycle({
        userId: activeId,
        managerId: newManagerId,
        userById,
      })
    ) {
      toast({
        variant: "destructive",
        description: "Invalid move: that would create a reporting cycle.",
      });
      return;
    }

    const previousUsers = localUsers;
    const previousManagerId = activeUser.managerId;

    const nextUsers = localUsers.map((user) => {
      if (user.id === activeId) {
        const manager =
          newManagerId && userById.get(newManagerId)
            ? {
                id: newManagerId,
                fullName: userById.get(newManagerId)!.fullName,
                name: userById.get(newManagerId)!.name,
                email: userById.get(newManagerId)!.email,
                position: userById.get(newManagerId)!.position,
              }
            : null;

        return {
          ...user,
          managerId: newManagerId,
          manager,
        };
      }

      if (user._count?.directReports != null) {
        if (user.id === previousManagerId) {
          return {
            ...user,
            _count: {
              ...user._count,
              directReports: Math.max(0, user._count.directReports - 1),
            },
          };
        }
        if (user.id === newManagerId) {
          return {
            ...user,
            _count: {
              ...user._count,
              directReports: user._count.directReports + 1,
            },
          };
        }
      }

      return user;
    });

    setLocalUsers(nextUsers);
    setSavingMove(true);

    try {
      const res = await fetch("/api/admin/organization/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeId, managerId: newManagerId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to update hierarchy.");
      }

      toast({ description: "Hierarchy updated." });
    } catch (error) {
      setLocalUsers(previousUsers);
      toast({
        variant: "destructive",
        description: (error as Error).message,
      });
    } finally {
      setSavingMove(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm md:flex-row md:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search org chart"
          className="h-10 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-ring md:flex-1"
        />

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="h-10 rounded-xl border px-3 text-sm"
        >
          <option value="all">All departments</option>
          {departments.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="h-10 rounded-xl border px-3 text-sm"
        >
          <option value="all">All branches</option>
          {branches.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {!canEdit ? null : (
          <Button
            type="button"
            variant={editMode ? "default" : "outline"}
            className="rounded-xl md:ml-auto"
            onClick={() => {
              if (savingMove) return;
              setEditMode((prev) => !prev);
            }}
            disabled={savingMove}
          >
            {editMode ? "Done" : "Edit hierarchy"}
          </Button>
        )}
      </div>

      <div className="rounded-3xl border bg-slate-50/60 p-6 shadow-sm">
        {tree.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No matching users found.
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
              <div className="flex min-w-max flex-col items-center gap-8 px-6">
                <RootDropZone enabled={editMode && canEdit} />

                <div className="flex min-w-max flex-row items-start gap-8">{tree.map((root) => (
                  <OrgNodeCard
                    key={root.id}
                    node={root}
                    editMode={editMode && canEdit}
                    onSelect={(user) => {
                      setSelectedUserId(user.id);
                      setSheetOpen(true);
                    }}
                  />
                ))}</div>
              </div>
            </DndContext>
          </div>
        )}
      </div>

      <UserProfileSheet
        user={selectedUser}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
