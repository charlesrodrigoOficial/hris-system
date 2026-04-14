import "dotenv/config";
import { prisma } from "../db/prisma";

async function main() {
  const existing = await prisma.payrollPolicy.findFirst({
    where: { status: "ACTIVE" },
  });
  if (existing) return;

  await prisma.payrollPolicy.create({
    data: {
      name: "Default Company Policy",
      version: 1,
      status: "ACTIVE",
      currency: "GBP",
      effectiveFrom: new Date("2026-01-01"),
      notes: "Initial policy",
      rules: {
        create: [
          {
            label: "Company tax",
            kind: "TAX",
            valueType: "PERCENT",
            value: "18.0000",
            sortOrder: 0,
          },
          {
            label: "Company deduction",
            kind: "DEDUCTION",
            valueType: "PERCENT",
            value: "7.0000",
            sortOrder: 0,
          },
        ],
      },
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
