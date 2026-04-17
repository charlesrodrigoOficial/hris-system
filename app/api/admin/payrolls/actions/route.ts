import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/auth/rbac";
import {
  executePayrollAction,
  isPayrollAction,
} from "./functions/payroll-actions";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const runIdRaw = String(body?.runId ?? "").trim();
    const runId = runIdRaw ? runIdRaw : undefined;

    if (!isPayrollAction(actionRaw)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (runId && !UUID_REGEX.test(runId)) {
      return NextResponse.json({ error: "Invalid runId" }, { status: 400 });
    }

    const result = await executePayrollAction({
      action: actionRaw,
      actorId: actor.id,
      payrollRunId: runId,
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
