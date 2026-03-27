import { auth } from "@/auth";
import { redirect } from "next/navigation";
import OrganizationClient from "@/components/admin/organization/organization-client";
import { prisma } from "@/db/prisma";

export default async function UserOrganizationPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      fullName: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
      role: true,
      position: true,
      orgLevel: true,
      managerId: true,
      phoneNo: true,
      address: true,
      officeLocation: true,
      country: true,
      employmentType: true,
      isActive: true,
      dateOfBirth: true,
      hireDate: true,
      about: true,
      linkedIn: true,
      hobbies: true,
      superpowers: true,
      mostFascinatingTrip: true,
      dreamTravelDestination: true,
      manager: {
        select: {
          id: true,
          fullName: true,
          name: true,
          email: true,
          position: true,
        },
      },
      department: {
        select: {
          departmentName: true,
        },
      },
      branch: {
        select: {
          branchName: true,
        },
      },
      _count: {
        select: {
          directReports: true,
        },
      },
    },
    orderBy: [{ createdAt: "asc" }],
  });

  const normalizedUsers = users.map((user) => ({
    ...user,
    role: String(user.role),
    country: user.country ? String(user.country) : null,
    employmentType: user.employmentType ? String(user.employmentType) : null,
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
    hireDate: user.hireDate ? user.hireDate.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organization</h1>
        <p className="text-sm text-muted-foreground">
          Workforce tree from top-level leadership to employees.
        </p>
      </div>

      <OrganizationClient users={normalizedUsers} />
    </div>
  );
}

