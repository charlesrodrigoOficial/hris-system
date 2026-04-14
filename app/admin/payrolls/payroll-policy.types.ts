export type PayrollPolicyRuleKind = "EARNING" | "TAX" | "DEDUCTION";
export type PayrollPolicyRuleValueType = "PERCENT" | "FIXED";
export type PayrollPolicyStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type PayrollPolicyRuleView = {
  id: string;
  label: string;
  kind: PayrollPolicyRuleKind;
  valueType: PayrollPolicyRuleValueType;
  value: number;
  isActive: boolean;
  sortOrder: number;
  minAmount: number | null;
  maxAmount: number | null;
};

export type PayrollPolicyView = {
  id: string;
  name: string;
  version: number;
  status: PayrollPolicyStatus;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  notes: string | null;
  rules: PayrollPolicyRuleView[];
};

export type PayrollPolicyHistoryRow = {
  id: string;
  name: string;
  version: number;
  status: PayrollPolicyStatus;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  updatedAt: string;
};

