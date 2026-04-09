import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { Button } from "@/components/ui/button";
import { signOutUser } from "@/lib/actions/user.actions";
import { adminHomePath, canAccessAdminArea, formatUserRoleLabel } from "@/lib/user/role-label";

export default async function MobileUserPanel() {
  const session = await auth();

  if (!session) {
    return (
      <div className="w-full space-y-3 rounded-xl border bg-muted/30 p-4">
        <p className="text-sm font-medium">Not signed in</p>
        <Button asChild className="w-full">
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    );
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, role: true, image: true },
  });

  const displayName = currentUser?.name ?? session.user?.name ?? "User";
  const displayEmail = currentUser?.email ?? session.user?.email ?? "";
  const displayRole = currentUser?.role ?? session.user?.role ?? "USER";
  const displayImage = currentUser?.image ?? session.user?.image ?? null;
  const firstInitial = displayName.charAt(0).toUpperCase() || "U";

  return (
    <div className="w-full space-y-4 rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 overflow-hidden rounded-full bg-slate-200">
          {displayImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayImage}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-700">
              {firstInitial}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{displayName}</div>
          {displayEmail ? (
            <div className="truncate text-xs text-muted-foreground">
              {displayEmail}
            </div>
          ) : null}
          <div className="mt-1 inline-flex rounded-full bg-slate-900/5 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            {formatUserRoleLabel(displayRole)}
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/user/profile/edit">Edit Profile</Link>
        </Button>

        {canAccessAdminArea(displayRole) && (
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href={adminHomePath(displayRole)}>Admin</Link>
          </Button>
        )}

        <form action={signOutUser}>
          <Button variant="ghost" className="w-full justify-start">
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
