import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/auth/rbac";
import {
  executePayrollAction,
  isPayrollAction,
} from "./functions/payroll-actions";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const actor = session?.user;

    if (!actor?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(actor.role, "payroll:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const actionRaw = String(body?.action ?? "").trim().toUpperCase();

    if (!isPayrollAction(actionRaw)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const result = await executePayrollAction({
      action: actionRaw,
      actorId: actor.id,
    });

    revalidatePath("/admin/payrolls");
    revalidatePath("/user/payroll");

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to perform payroll action.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
