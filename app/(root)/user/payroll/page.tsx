import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { redirect } from "next/navigation";
import PayrollClient from "./payroll.client";
import { getUserPayrollData } from "./payroll-data";

export default async function UserPayrollPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [user, payStubs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        image: true,
        currency: true,
      },
    }),
    getUserPayrollData(session.user.id),
  ]);

  return (
    <PayrollClient
      user={{
        name: user?.name ?? session.user.name ?? "You",
        image: user?.image ?? null,
        currency: user?.currency ?? "GBP",
      }}
      payStubs={payStubs}
    />
  );
}
