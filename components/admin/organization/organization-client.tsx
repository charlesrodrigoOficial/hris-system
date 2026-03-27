"use client";

import { useMemo, useState } from "react";
import OrgNodeCard from "@/components/admin/organization/org-node";
import { buildOrgTree, type OrgUser } from "@/lib/build-org-tree";
import UserProfileSheet from "./user-profile-sheet";

type Props = {
  users: OrgUser[];
};

export default function OrganizationClient({ users }: Props) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [branch, setBranch] = useState("all");
  const [selectedUser, setSelectedUser] = useState<OrgUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        users
          .map((u) => u.department?.departmentName)
          .filter((v): v is string => Boolean(v))
      )
    ).sort();
  }, [users]);

  const branches = useMemo(() => {
    return Array.from(
      new Set(
        users
          .map((u) => u.branch?.branchName)
          .filter((v): v is string => Boolean(v))
      )
    ).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    const directlyMatched = users.filter((user) => {
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
    const userMap = new Map(users.map((u) => [u.id, u]));

    for (const user of directlyMatched) {
      keepIds.add(user.id);

      let currentManagerId = user.managerId;
      while (currentManagerId) {
        keepIds.add(currentManagerId);
        currentManagerId = userMap.get(currentManagerId)?.managerId ?? null;
      }
    }

    return users.filter((u) => keepIds.has(u.id));
  }, [users, search, department, branch]);

  const tree = useMemo(() => buildOrgTree(filteredUsers), [filteredUsers]);

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
      </div>

      <div className="rounded-3xl border bg-slate-50/60 p-6 shadow-sm">
        {tree.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No matching users found.
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex min-w-max flex-col items-center gap-12 px-6">
              {tree.map((root) => (
                <OrgNodeCard
                  key={root.id}
                  node={root}
                  onSelect={(user) => {
                    setSelectedUser(user);
                    setSheetOpen(true);
                  }}
                />
              ))}
            </div>
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