import { NextResponse } from "next/server"
import { prisma } from "@/db/prisma"
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  const request = await prisma.request.create({
    data: {
      type: body.type,
      title: body.title,
      description: body.description,
      userId: session.user.id,
    },
  })

  return NextResponse.json(request)
}