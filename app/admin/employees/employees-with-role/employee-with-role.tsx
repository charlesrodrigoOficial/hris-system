import { prisma } from "@/db/prisma";
import EmployeeTable from "@/components/admin/employees/employee-table";

type TableRow = {
  userId: string;
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
  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      fullName: true,
      email: true,
      role: true,
      phoneNo: true,
      employmentType: true,
      isActive: true,
      contractEndDate: true,
      department: { select: { departmentName: true } },
      branch: { select: { branchName: true } },
      position: true,
      shift: { select: { name: true } },
    },
  });

  const rows: TableRow[] = users.map((user) => ({
    userId: user.id,
    id: user.id,
    fullName: user.fullName ?? user.name ?? "Unnamed",
    email: user.email,
    phoneNo: user.phoneNo ?? "",
    employmentType: user.employmentType ?? "FULL_TIME",
    isActive: user.isActive ?? true,
    contractEndDate: user.contractEndDate ?? null,
    user: { name: user.name, email: user.email, role: user.role },
    department: user.department ?? null,
    branch: user.branch ?? null,
    position: user.position ?? null,
    shift: user.shift ?? null,
  }));

  return <EmployeeTable employees={rows} />;
}
