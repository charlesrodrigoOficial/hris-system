import { prisma } from "@/db/prisma";
import EmployeeTable from "@/components/admin/employees/employee-table";

type TableRow = {
  userId: string; // ✅ add
  id: string;
  fullName: string;
  email: string;
  phoneNo: string;
  employmentType?: string;
  isActive?: boolean;
  contractEndDate?: Date | null;
  user?: { name: string | null; email: string; role: string } | null;
  department?: { departmentName: string } | null;
  branch?: { branchName: string } | null;
  position?: string | null;
  shift?: { name: string } | null;
};

export default async function EmployeeWithRole() {
  // Fetch all users that hold EMPLOYEE role
  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      employee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNo: true,
          employmentType: true,
          isActive: true,
          contractEndDate: true,
          department: { select: { departmentName: true } },
          branch: { select: { branchName: true } },
          position: true,
          shift: { select: { name: true } },
        },
      },
    },
  });

  // Map to EmployeeTable shape
 const rows: TableRow[] = users.map((u) => {
  const e = u.employee;
  return {
    userId: u.id,               // ✅ add
    id: e?.id ?? u.id,
    fullName: e?.fullName ?? u.name ?? "Unnamed",
    email: e?.email ?? u.email,
    phoneNo: e?.phoneNo ?? "",
    employmentType: e?.employmentType ?? "FULL_TIME",
    isActive: e?.isActive ?? true,
    contractEndDate: e?.contractEndDate ?? null,
    user: { name: u.name, email: u.email, role: u.role },
    department: e?.department ?? null,
    branch: e?.branch ?? null,
    position: e?.position ?? null,
    shift: e?.shift ?? null,
  };
});

  return <EmployeeTable employees={rows} />;
}
