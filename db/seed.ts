import { prisma } from "./prisma";

const DEPARTMENT_NAMES = [
  "ADMINISTRATION",
  "HR",
  "FINANCE",
  "ENGINEERING",
  "OPERATIONS",
  "SALES",
  "MARKETING",
  "CUSTOMER_SUPPORT",
] as const;

async function main() {
  for (const departmentName of DEPARTMENT_NAMES) {
    await prisma.department.upsert({
      where: { departmentName },
      update: {},
      create: { departmentName },
    });
  }

  console.log("Departments seeded");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
