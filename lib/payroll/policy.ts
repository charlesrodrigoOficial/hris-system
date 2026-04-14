import type { PayrollPolicyRule } from "@prisma/client";

function roundMoney(v: number) {
  return Math.round(v * 100) / 100;
}

function toNum(value: unknown) {
  const n =
    (value as { toNumber?: () => number })?.toNumber?.() ?? Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function applyRule(base: number, rule: PayrollPolicyRule) {
  const raw =
    rule.valueType === "PERCENT"
      ? (base * toNum(rule.value)) / 100
      : toNum(rule.value);

  const min = rule.minAmount == null ? null : toNum(rule.minAmount);
  const max = rule.maxAmount == null ? null : toNum(rule.maxAmount);

  let amount = raw;
  if (min != null) amount = Math.max(amount, min);
  if (max != null) amount = Math.min(amount, max);

  return roundMoney(Math.max(0, amount));
}

export function calculateFromPolicy(
  baseSalary: number,
  rules: PayrollPolicyRule[],
) {
  const earningsRules = rules.filter((r) => r.kind === "EARNING" && r.isActive);
  const taxRules = rules.filter((r) => r.kind === "TAX" && r.isActive);
  const deductionRules = rules.filter(
    (r) => r.kind === "DEDUCTION" && r.isActive,
  );

  const earningsTotal = earningsRules.reduce(
    (sum, r) => sum + applyRule(baseSalary, r),
    0,
  );
  const grossPay = roundMoney(baseSalary + earningsTotal);

  const taxesTotal = roundMoney(
    taxRules.reduce((sum, r) => sum + applyRule(grossPay, r), 0),
  );
  const deductionsTotal = roundMoney(
    deductionRules.reduce((sum, r) => sum + applyRule(grossPay, r), 0),
  );

  const netPay = roundMoney(grossPay - taxesTotal - deductionsTotal);

  return { grossPay, taxesTotal, deductionsTotal, netPay };
}
