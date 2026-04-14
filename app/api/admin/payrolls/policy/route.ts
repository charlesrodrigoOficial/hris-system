import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/db/prisma";

const policyRuleSchema = z.object({
  label: z.string().trim().min(1).max(120),
  kind: z.enum(["EARNING", "TAX", "DEDUCTION"]),
  valueType: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().min(0).max(1_000_000),
  minAmount: z.coerce.number().min(0).nullable().optional(),
  maxAmount: z.coerce.number().min(0).nullable().optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

const updatePolicySchema = z.object({
  name: z.string().trim().min(2).max(120),
  currency: z.string().trim().min(3).max(3),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(2_000).nullable().optional(),
  rules: z.array(policyRuleSchema).min(1),
});

function toUtcDateStart(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dec4(value: number) {
  return new Prisma.Decimal(value.toFixed(4));
}

function dec2OrNull(value: number | null | undefined) {
  if (value == null) return null;
  return new Prisma.Decimal(value.toFixed(2));
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    const actor = session?.user;

    if (!actor?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(actor.role, "payroll:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rawBody = await req.json().catch(() => null);
    const parsed = updatePolicySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body." },
        { status: 400 },
      );
    }

    const payload = parsed.data;
    const effectiveFrom = toUtcDateStart(payload.effectiveFrom);
    if (Number.isNaN(effectiveFrom.getTime())) {
      return NextResponse.json({ error: "Invalid effectiveFrom date." }, { status: 400 });
    }

    for (const rule of payload.rules) {
      if (rule.minAmount != null && rule.maxAmount != null && rule.maxAmount < rule.minAmount) {
        return NextResponse.json(
          { error: `Rule "${rule.label}" has maxAmount lower than minAmount.` },
          { status: 400 },
        );
      }
    }

    const normalizedName = payload.name.trim();
    const normalizedCurrency = payload.currency.trim().toUpperCase();

    const createdPolicy = await prisma.$transaction(async (tx) => {
      const currentActive = await tx.payrollPolicy.findFirst({
        where: { status: "ACTIVE" },
        orderBy: [{ effectiveFrom: "desc" }, { version: "desc" }],
        select: { id: true, effectiveFrom: true },
      });

      if (currentActive) {
        const archiveTo = new Date(effectiveFrom);
        archiveTo.setUTCDate(archiveTo.getUTCDate() - 1);

        await tx.payrollPolicy.update({
          where: { id: currentActive.id },
          data: {
            status: "ARCHIVED",
            effectiveTo:
              archiveTo.getTime() >= currentActive.effectiveFrom.getTime()
                ? archiveTo
                : currentActive.effectiveFrom,
          },
        });
      }

      const versionAgg = await tx.payrollPolicy.aggregate({
        where: { name: normalizedName },
        _max: { version: true },
      });
      const nextVersion = (versionAgg._max.version ?? 0) + 1;

      return tx.payrollPolicy.create({
        data: {
          name: normalizedName,
          version: nextVersion,
          status: "ACTIVE",
          currency: normalizedCurrency,
          effectiveFrom,
          effectiveTo: null,
          notes: payload.notes?.trim() || null,
          createdById: actor.id,
          approvedById: actor.id,
          rules: {
            create: payload.rules.map((rule, index) => ({
              label: rule.label.trim(),
              kind: rule.kind,
              valueType: rule.valueType,
              value: dec4(rule.value),
              minAmount: dec2OrNull(rule.minAmount),
              maxAmount: dec2OrNull(rule.maxAmount),
              isActive: rule.isActive ?? true,
              sortOrder: rule.sortOrder ?? index,
            })),
          },
        },
        select: {
          id: true,
          version: true,
        },
      });
    });

    revalidatePath("/admin/payrolls");

    return NextResponse.json({
      message: `Payroll policy v${createdPolicy.version} saved and activated.`,
      policyId: createdPolicy.id,
      version: createdPolicy.version,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update payroll policy.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

