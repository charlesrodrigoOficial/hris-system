import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import HelpClient from "./help-client";

export const metadata: Metadata = {
  title: "Help",
};

export default async function HelpPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <HelpClient />
    </div>
  );
}

