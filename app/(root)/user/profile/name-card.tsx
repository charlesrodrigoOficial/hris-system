import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NameCardClient from "./name-card.client";

const NameCard = async () => {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <NameCardClient
      name={session.user.name ?? "Employee"}
      role={session.user.role ?? "USER"}
    />
  );
};

export default NameCard;