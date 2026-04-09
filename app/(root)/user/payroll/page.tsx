import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { redirect } from "next/navigation";
import PayrollClient from "./payroll.client";

export default async function UserPayrollPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      image: true,
      currency: true,
      salary: true,
    },
  });

  const salary =
    user?.salary == null
      ? null
      : ((user.salary as unknown as { toNumber?: () => number }).toNumber?.() ??
        Number(user.salary));

  return (
    <PayrollClient
      user={{
        name: user?.name ?? session.user.name ?? "You",
        image: user?.image ?? null,
        currency: user?.currency ?? "GBP",
        salary,
      }}
    />
  );
}

