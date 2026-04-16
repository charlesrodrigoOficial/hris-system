import ModeToggle from "./mode-toggle";
import { EllipsisVertical } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import UserButton from "./user-button";
import NotificationBell from "./notification-bell";
import { auth } from "@/auth";
import { UserSidebarNav } from "@/components/user-dashboard/users-sidebar";

const Menu = async () => {
  const session = await auth();
  const role = session?.user?.role ?? null;

  return (
    <div className="flex justify-end gap-3">
      <nav className="hidden md:flex w-full max-w-xs items-center gap-1 text-[#DBEAFE]">
        <NotificationBell />
        <ModeToggle />

        <UserButton />
      </nav>
      <nav className="md:hidden">
        <Sheet>
          <SheetTrigger className="align-middle text-[#DBEAFE]">
            <EllipsisVertical />
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col gap-4 min-h-0">
            <SheetTitle>Menu</SheetTitle>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ModeToggle />
            </div>

            <div className="w-full">
              <UserButton />
            </div>

            <UserSidebarNav
              role={role}
              closeOnNavigate
              className="w-full min-h-0 border-t pt-3"
            />
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;
