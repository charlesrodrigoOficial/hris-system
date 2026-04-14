import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/db/prisma";
import { getUserById } from "@/lib/actions/user.actions";
import { updateUserSchema } from "@/lib/validators";
import UpdateUserForm from "./update-user-form";
import { z } from "zod";
import { requireAdminPermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Update User",
};

type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

function splitName(
  firstName?: string | null,
  lastName?: string | null,
  fullName?: string | null,
) {
  if (firstName || lastName) {
    return {
      firstName: firstName ?? "",
      lastName: lastName ?? "",
    };
  }

  const trimmed = fullName?.trim() ?? "";
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const [head, ...tail] = trimmed.split(/\s+/);
  return {
    firstName: head ?? "",
    lastName: tail.join(" "),
  };
}

const AdminUserUpdatePage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  await requireAdminPermission("roles:assign");
  const { id } = await props.params;

  const [user, departments, employees] = await Promise.all([
    getUserById(id),
    prisma.department.findMany({
      orderBy: { departmentName: "asc" },
      select: { id: true, departmentName: true },
    }),
    prisma.user.findMany({
      where: {
        role: {
          in: [
            "EMPLOYEE",
            "HR_MANAGER",
            "PAYROLL_MANAGER",
            "SUPER_ADMIN",
          ],
        },
      },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        name: true,
        email: true,
      },
    }),
  ]);

  if (!user) notFound();

  const { firstName, lastName } = splitName(
    user.firstName,
    user.lastName,
    user.name,
  );

  const formUser: UpdateUserFormValues & { employeeId?: string | null } = {
    id: user.id,
    image: user.image ?? "",
    email: user.email,
    role: user.role,
    firstName,
    lastName,
    about: user.about ?? "",
    linkedIn: user.linkedIn ?? "",
    dateOfBirth: user.dateOfBirth
      ? user.dateOfBirth.toISOString().slice(0, 10)
      : "",
    hobbies: user.hobbies ?? "",
    superpowers: user.superpowers ?? "",
    mostFascinatingTrip: user.mostFascinatingTrip ?? "",
    dreamTravelDestination: user.dreamTravelDestination ?? "",
    postCode: user.postCode ?? "",
    country: user.country ?? null,
    address: user.address ?? "",
    accountName: user.accountName ?? "",
    accountNumber: user.accountNumber ?? "",
    swiftCode: user.swiftCode ?? "",
    iban: user.iban ?? "",
    sortCode: user.sortCode ?? "",
    workEligibility: user.workEligibility ?? "",
    position: user.position ?? "",
    departmentId: user.departmentId ?? "",
    employmentType: user.employmentType ?? null,
    originalCompany: user.originalCompany ?? "",
    startDate: user.hireDate
      ? user.hireDate.toISOString().slice(0, 10)
      : "",
    officeLocation: user.officeLocation ?? "",
    onboardingLocation: user.onboardingLocation ?? "",
    onboardingTravel: user.onboardingTravel ?? "",
    orgLevel: user.orgLevel ?? "",
    managerId: user.managerId ?? "",
    secondLevelManagerId: user.secondLevelManagerId ?? "",
    salary: user.salary?.toString() ?? "",
    currency: user.currency ?? "GBP",
    employeeId: user.id,
  };

  const managerOptions = employees.map((employee) => ({
    id: employee.id,
    label: employee.email
      ? `${employee.fullName ?? employee.name ?? employee.email} - ${employee.email}`
      : employee.fullName ?? employee.name ?? "Unnamed",
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="h2-bold">Update User</h1>
        <p className="text-sm text-muted-foreground">
          Manage profile, banking, and employment details in one place.
        </p>
      </div>

      <UpdateUserForm
        user={formUser}
        departments={departments.map((department) => ({
          id: department.id,
          name: department.departmentName,
        }))}
        managers={managerOptions}
      />
    </div>
  );
};

export default AdminUserUpdatePage;
