"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import type { OrgUser } from "@/lib/build-org-tree";

type Props = {
  user: OrgUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

export default function UserProfileSheet({ user, open, onOpenChange }: Props) {
  const pathname = usePathname();
  const showAdminProfileLink = pathname.startsWith("/admin/");
  const displayName = user?.fullName || user?.name || user?.email || "Profile";
  const initials = getInitials(displayName);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {!user ? null : (
          <div className="space-y-6">
            <SheetHeader className="text-left">
              <SheetTitle>User Profile</SheetTitle>
              <SheetDescription>
                Workforce details and reporting information.
              </SheetDescription>
            </SheetHeader>

            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-muted">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-xl font-semibold">
                    {displayName}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {user.position || "No position"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">{user.role}</Badge>
                    <Badge variant="outline">
                      {user.department?.departmentName || "No department"}
                    </Badge>
                    <Badge variant="outline">
                      {user.branch?.branchName || "No branch"}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    {!showAdminProfileLink ? null : (
                      <Button asChild className="rounded-xl">
                        <Link href={`/admin/users/${user.id}/edit`}>
                          View full profile
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold">Work Information</h3>
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Phone" value={user.phoneNo} />
              <InfoRow label="Position" value={user.position} />
              <InfoRow label="Org level" value={user.orgLevel} />
              <InfoRow
                label="Department"
                value={user.department?.departmentName}
              />
              <InfoRow label="Branch" value={user.branch?.branchName} />
              <InfoRow label="Employment" value={user.employmentType} />
              <InfoRow label="Office" value={user.officeLocation} />
              <InfoRow
                label="Manager"
                value={
                  user.manager
                    ? `${user.manager.fullName || user.manager.name || user.manager.email}${
                        user.manager.position
                          ? ` • ${user.manager.position}`
                          : ""
                      }`
                    : "Top level / No manager"
                }
              />
              <InfoRow
                label="Reports"
                value={String(user._count?.directReports ?? 0)}
              />
              <InfoRow label="Hire date" value={formatDate(user.hireDate)} />
              <InfoRow
                label="Status"
                value={user.isActive ? "Active" : "Inactive"}
              />
            </div>

            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold">
                Personal Information
              </h3>
              <InfoRow label="DOB" value={formatDate(user.dateOfBirth)} />
              <InfoRow label="Country" value={user.country} />
              <InfoRow label="Address" value={user.address} />
            </div>

            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold">Profile Details</h3>
              <InfoRow label="About" value={user.about} />
              <InfoRow label="LinkedIn" value={user.linkedIn} />
              <InfoRow label="Hobbies" value={user.hobbies} />
              <InfoRow label="Superpowers" value={user.superpowers} />
              <InfoRow label="Best trip" value={user.mostFascinatingTrip} />
              <InfoRow
                label="Dream destination"
                value={user.dreamTravelDestination}
              />
            </div>
            <div className="space-y-6"></div>
          </div>
          
        )}
      </SheetContent>
    </Sheet>
  );
}
