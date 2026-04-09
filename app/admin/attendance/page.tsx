import AttendanceAdminClient from "@/components/admin/ui/attendance-admin-client"
import { requireAdminPermission } from "@/lib/auth/guards";

export default async function AttendanceAdminPage() {
  await requireAdminPermission("attendance:review");
  return <AttendanceAdminClient />
}
