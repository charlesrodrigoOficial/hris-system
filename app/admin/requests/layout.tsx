import { requireAdminPermission } from "@/lib/auth/guards";

export default async function AdminRequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPermission("requests:manage");
  return children;
}

