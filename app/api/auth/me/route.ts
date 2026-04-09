import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: session.user.id,
    role: session.user.role ?? null,
    name: session.user.name ?? null,
    email: (session.user as any)?.email ?? null,
    fullName: (session.user as any)?.fullName ?? null,
  });
}

