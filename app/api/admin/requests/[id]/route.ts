import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";

function buildRequestHref(params: { id: string; type: string }) {
  const focus = encodeURIComponent(params.id);

  if (params.type === "LEAVE") {
    return `/user/requests?mode=leave&focus=${focus}`;
  }

  if (params.type === "SUPPORT" || params.type === "CLAIM") {
    return `/user/requests?mode=support&focus=${focus}`;
  }

  return `/user/requests?focus=${focus}`;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const actor = session?.user;

    if (!actor?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = ["ADMIN", "HR"];
    if (!allowed.includes(actor.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const nextStatus = String(body?.status ?? "").toUpperCase();
    const note =
      typeof body?.note === "string" && body.note.trim()
        ? body.note.trim()
        : null;

    if (nextStatus !== "APPROVED" && nextStatus !== "REJECTED") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.request.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          type: true,
          userId: true,
        },
      });

      if (!current) {
        return { request: null as any, changed: false };
      }

      const updated = await tx.request.updateMany({
        where: {
          id,
          status: { in: ["PENDING", "PROCESSING"] },
        },
        data: { status: nextStatus },
      });

      const request = await tx.request.findUnique({ where: { id } });
      if (!request) return { request: null as any, changed: false };

      if (updated.count > 0) {
        await tx.requestActivity.create({
          data: {
            requestId: id,
            actorId: actor.id,
            fromStatus: current.status,
            toStatus: nextStatus,
            note,
          },
        });

        await tx.notification.create({
          data: {
            userId: request.userId,
            title: "Request Status Updated",
            message: `Your request status is now ${request.status}`,
            href: buildRequestHref({ id: request.id, type: request.type }),
          },
        });
      }

      return { request, changed: updated.count > 0 };
    });

    if (!result.request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json(result.request);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 },
    );
  }
}
