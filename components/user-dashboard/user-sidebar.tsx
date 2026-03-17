"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, User, Wallet } from "lucide-react"

const items = [
  { title: "Dashboard", href: "/user", icon: LayoutDashboard },
  { title: "Profile", href: "/user/profile", icon: User },
  { title: "Salary", href: "/user#salary", icon: Wallet },
]

export function UserSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "hidden md:flex h-[calc(100vh-64px)] w-16 lg:w-56 flex-col gap-2",
        "rounded-2xl border border-white/10",
        "bg-gradient-to-b from-blue-950/40 via-blue-900/25 to-blue-950/20",
        "backdrop-blur-xl shadow-lg"
      )}
    >
      <div className="px-3 py-4">
        <div className="text-white/90 font-semibold hidden lg:block">Menu</div>
      </div>

      <nav className="px-2 pb-3 flex-1 space-y-1">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/user" && pathname.startsWith(item.href))

          const Icon = item.icon

          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                "text-white/80 hover:text-white hover:bg-white/10 transition",
                active && "bg-white/15 text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden lg:block">{item.title}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-2">
        <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/70 hidden lg:block">
          Intelura HRIS
        </div>
      </div>
    </aside>
  )
}
