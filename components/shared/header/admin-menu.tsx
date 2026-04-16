import ModeToggle from "./mode-toggle";
import { EllipsisVertical } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import UserButton from "./user-button";
import NotificationBell from "./notification-bell";
import { AdminSidebarNav } from "@/components/admin/ui/admin-sidebar";
import { auth } from "@/auth";

const AdminMenu = async () => {
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

          <SheetContent
            side="left"
            className="flex min-h-0 flex-col gap-4 bg-gradient-to-b from-[#0B1F5F] via-[#123187] to-[#1D4ED8] text-[#DBEAFE]"
          >
            <SheetTitle>Admin Menu</SheetTitle>

            <div className="flex items-center gap-2">
              <NotificationBell />
              <ModeToggle />
            </div>

            <div className="w-full">
              <UserButton />
            </div>

            <AdminSidebarNav
              role={role}
              closeOnNavigate
              className="w-full min-h-0 border-t border-[#93C5FD]/40 pt-3"
            />
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default AdminMenu;
