import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { redirect } from "next/navigation";
import NameCardClient from "./name-card.client";

const NameCard = async () => {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, role: true, image: true },
  });

  return (
    <NameCardClient
      name={currentUser?.name ?? session.user.name ?? "Employee"}
      role={currentUser?.role ?? session.user.role ?? "EMPLOYEE"}
      image={currentUser?.image ?? session.user.image ?? null}
    />
  );
};

export default NameCard;
