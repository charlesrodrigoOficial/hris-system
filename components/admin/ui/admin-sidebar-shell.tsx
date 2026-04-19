"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Sidebar from "./admin-sidebar";

export default function AdminSidebarShell({ role }: { role?: string | null }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 border-r border-[#1D4ED8]/45 bg-gradient-to-b from-[#0B1F5F] via-[#123187] to-[#1D4ED8] py-6 transition-[width] duration-200 lg:block",
        collapsed ? "w-20" : "w-56"
      )}
    >
      <Sidebar
        role={role}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((previous) => !previous)}
      />
    </aside>
  );
}
