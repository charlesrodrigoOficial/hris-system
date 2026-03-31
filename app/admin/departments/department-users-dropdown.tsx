"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { removeUserFromDepartment } from "@/lib/actions/department.actions";

type DepartmentUser = {
  id: string;
  image: string | null;
  firstName: string | null;
  fullName: string | null;
  name: string | null;
  email: string;
  country: string | null;
};

function formatEnumLabel(value: string | null) {
  if (!value) return "-";
  const trimmed = value.trim();
  if (!trimmed) return "-";
  if (!trimmed.includes("_")) return trimmed;

  return trimmed
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name: string) {
  const parts = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  return (parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "");
}

export default function DepartmentUsersDropdown(props: {
  departmentId: string;
  departmentName: string;
  users: DepartmentUser[];
}) {
  const { departmentId, departmentName } = props;
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = React.useState<DepartmentUser[]>(props.users);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleRemove(userId: string) {
    startTransition(async () => {
      setRemovingId(userId);
      const res = await removeUserFromDepartment({ departmentId, userId });
      setRemovingId(null);

      if (!res.success) {
        toast({ variant: "destructive", description: res.message });
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast({ description: res.message });
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 text-left hover:underline">
          <span className="font-medium">{departmentName}</span>
          <span className="text-xs text-muted-foreground">({users.length})</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[460px] p-0">
        <div className="border-b px-3 py-2">
          <div className="text-sm font-medium">Users in {departmentName}</div>
          <div className="text-xs text-muted-foreground">
            {users.length} user(s)
          </div>
        </div>

        <ScrollArea className="max-h-80">
          {users.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">
              No users assigned to this department.
            </div>
          ) : (
            <div className="p-2">
              {users.map((user) => {
                const displayName =
                  user.firstName?.trim() ||
                  user.fullName?.trim() ||
                  user.name?.trim() ||
                  user.email;
                const country = formatEnumLabel(user.country);
                const disabled = isPending && removingId === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={user.image ?? undefined}
                          alt={displayName}
                        />
                        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {displayName}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {user.email} • {country}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={disabled}
                      onClick={() => handleRemove(user.id)}
                    >
                      {disabled ? "Removing..." : "Remove"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

