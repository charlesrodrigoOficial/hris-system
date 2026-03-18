import { prisma } from "@/db/prisma";
import HeadcountChart from "@/components/admin/employees/headcount-chart";
import ReviewStatusList from "@/components/admin/employees/review-status-list";
import LastDayList from "@/components/admin/employees/last-day-list";
import EmployeeTable from "@/components/admin/employees/employee-table";

function firstDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default async function EmployeeData() {
  const today = new Date();
  const month = firstDayOfMonth(today);

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: { createdAt: "desc" },
    include: {
      department: { select: { id: true, departmentName: true } },
      branch: { select: { id: true, branchName: true } },
      shift: { select: { id: true, name: true } },
    },
  });

  const usersByRole = await prisma.user.groupBy({
    by: ["role"],
    _count: { _all: true },
    orderBy: { role: "asc" },
  });

  const headcountData = usersByRole.map((row) => ({
    role: row.role,
    count: row._count._all,
  }));

  const reviewsThisMonth = await prisma.performanceReview.findMany({
    where: {
      month,
      employeeId: { in: employees.map((employee) => employee.id) },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      employeeId: true,
      status: true,
      month: true,
    },
  });

  const reviewsByEmployeeId = new Map(
    reviewsThisMonth.map((review) => [review.employeeId, review]),
  );

  const lastDayRows = employees
    .filter((employee) => employee.contractEndDate)
    .sort((left, right) => {
      const leftTime = new Date(left.contractEndDate ?? 0).getTime();
      const rightTime = new Date(right.contractEndDate ?? 0).getTime();
      return leftTime - rightTime;
    })
    .slice(0, 50)
    .map((employee) => ({
      fullName: employee.fullName ?? employee.name ?? "Unnamed",
      employmentType: employee.employmentType ?? "FULL_TIME",
      contractEndDate: employee.contractEndDate,
      user: { role: employee.role },
    }));

  const employeeRows = employees.map((employee) => ({
    ...employee,
    userId: employee.id,
    fullName: employee.fullName ?? employee.name ?? "Unnamed",
    employmentType: employee.employmentType ?? "FULL_TIME",
    user: { name: employee.name, email: employee.email, role: employee.role },
  }));

  const reviewRows = employees.map((employee) => {
    const review = reviewsByEmployeeId.get(employee.id);

    return {
      status: review?.status ?? "WAITING_FOR_REVIEW",
      month: review?.month ?? month,
      employeeId: employee.id,
      employee: {
        fullName: employee.fullName ?? employee.name ?? "Unnamed",
        employmentType: employee.employmentType ?? "FULL_TIME",
        user: { role: employee.role },
      },
    };
  });

  return (
    <div className="space-y-6">
      <HeadcountChart data={headcountData} />
      <ReviewStatusList month={month} reviews={reviewRows} />
      <LastDayList items={lastDayRows} />
      <EmployeeTable employees={employeeRows} />
    </div>
  );
}
