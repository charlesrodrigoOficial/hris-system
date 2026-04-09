import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { signOutUser } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserIcon } from "lucide-react";
import { adminHomePath, canAccessAdminArea } from "@/lib/user/role-label";

const UserButton = async () => {
  const session = await auth();

  if (!session) {
    return (
      <Button asChild>
        <Link href="/sign-in">
          <UserIcon /> Sign In
        </Link>
      </Button>
    );
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, role: true, image: true },
  });

  const displayName = currentUser?.name ?? session.user?.name ?? "User";
  const displayEmail = currentUser?.email ?? session.user?.email ?? "";
  const displayRole = currentUser?.role ?? session.user.role;
  const displayImage = currentUser?.image ?? session.user?.image ?? null;
  const firstInitial = displayName.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex gap-2 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="relative ml-2 h-8 w-8 overflow-hidden rounded-full bg-gray-200 p-0"
            >
              {displayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayImage}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-700">
                  {firstInitial}
                </span>
              )}
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="text-sm font-medium leading-none">
                {displayName}
              </div>
              <div className="text-sm text-muted-foreground leading-none">
                {displayEmail}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuItem>
            <Link href="/user/profile/edit" className="w-full">
              Edit Profile
            </Link>
          </DropdownMenuItem>

          {canAccessAdminArea(displayRole) && (
            <DropdownMenuItem>
              <Link href={adminHomePath(displayRole)} className="w-full">
                Admin
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem className="p-0 mb-1">
            <form action={signOutUser} className="w-full">
              <Button
                className="w-full py-4 px-2 justify-start"
                variant="ghost"
              >
                Sign Out
              </Button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserButton;
