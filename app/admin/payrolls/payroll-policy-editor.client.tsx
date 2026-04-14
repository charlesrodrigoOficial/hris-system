"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type {
  PayrollPolicyHistoryRow,
  PayrollPolicyRuleKind,
  PayrollPolicyRuleValueType,
  PayrollPolicyView,
} from "./payroll-policy.types";

type EditableRule = {
  label: string;
  kind: PayrollPolicyRuleKind;
  valueType: PayrollPolicyRuleValueType;
  value: string;
  minAmount: string;
  maxAmount: string;
  isActive: boolean;
  sortOrder: number;
};

type Props = {
  activePolicy: PayrollPolicyView | null;
  history: PayrollPolicyHistoryRow[];
  canEdit: boolean;
};

const ruleKinds: PayrollPolicyRuleKind[] = ["EARNING", "TAX", "DEDUCTION"];
const ruleValueTypes: PayrollPolicyRuleValueType[] = ["PERCENT", "FIXED"];

function toRuleForm(policy: PayrollPolicyView | null): EditableRule[] {
  if (!policy || policy.rules.length === 0) {
    return [
      {
        label: "Company tax",
        kind: "TAX",
        valueType: "PERCENT",
        value: "18",
        minAmount: "",
        maxAmount: "",
        isActive: true,
        sortOrder: 0,
      },
      {
        label: "Company deduction",
        kind: "DEDUCTION",
        valueType: "PERCENT",
        value: "7",
        minAmount: "",
        maxAmount: "",
        isActive: true,
        sortOrder: 1,
      },
    ];
  }

  return [...policy.rules]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((rule, index) => ({
      label: rule.label,
      kind: rule.kind,
      valueType: rule.valueType,
      value: String(rule.value),
      minAmount: rule.minAmount == null ? "" : String(rule.minAmount),
      maxAmount: rule.maxAmount == null ? "" : String(rule.maxAmount),
      isActive: rule.isActive,
      sortOrder: index,
    }));
}

function formatDate(dateIso: string) {
  if (!dateIso) return "-";
  const date = new Date(`${dateIso}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function statusClass(status: PayrollPolicyHistoryRow["status"]) {
  if (status === "ACTIVE") return "text-emerald-700";
  if (status === "ARCHIVED") return "text-slate-600";
  return "text-amber-700";
}

export default function PayrollPolicyEditor({ activePolicy, history, canEdit }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  const [name, setName] = React.useState(activePolicy?.name ?? "Company Payroll Policy");
  const [currency, setCurrency] = React.useState(activePolicy?.currency ?? "GBP");
  const [effectiveFrom, setEffectiveFrom] = React.useState(
    activePolicy?.effectiveFrom ?? new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = React.useState(activePolicy?.notes ?? "");
  const [rules, setRules] = React.useState<EditableRule[]>(() => toRuleForm(activePolicy));

  React.useEffect(() => {
    setName(activePolicy?.name ?? "Company Payroll Policy");
    setCurrency(activePolicy?.currency ?? "GBP");
    setEffectiveFrom(activePolicy?.effectiveFrom ?? new Date().toISOString().slice(0, 10));
    setNotes(activePolicy?.notes ?? "");
    setRules(toRuleForm(activePolicy));
  }, [activePolicy?.id, activePolicy?.version]);

  function updateRule(index: number, patch: Partial<EditableRule>) {
    setRules((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function addRule() {
    setRules((current) => [
      ...current,
      {
        label: "",
        kind: "DEDUCTION",
        valueType: "PERCENT",
        value: "0",
        minAmount: "",
        maxAmount: "",
        isActive: true,
        sortOrder: current.length,
      },
    ]);
  }

  function removeRule(index: number) {
    setRules((current) =>
      current
        .filter((_, rowIndex) => rowIndex !== index)
        .map((row, rowIndex) => ({ ...row, sortOrder: rowIndex })),
    );
  }

  async function savePolicy() {
    if (!canEdit) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({ variant: "destructive", description: "Policy name is required." });
      return;
    }

    if (!effectiveFrom) {
      toast({ variant: "destructive", description: "Effective date is required." });
      return;
    }

    const mappedRules = rules.map((rule, index) => ({
      label: rule.label.trim(),
      kind: rule.kind,
      valueType: rule.valueType,
      value: Number(rule.value || 0),
      minAmount:
        rule.minAmount.trim() === "" ? null : Number(rule.minAmount),
      maxAmount:
        rule.maxAmount.trim() === "" ? null : Number(rule.maxAmount),
      isActive: rule.isActive,
      sortOrder: index,
    }));

    if (mappedRules.some((rule) => !rule.label)) {
      toast({
        variant: "destructive",
        description: "Every rule needs a label.",
      });
      return;
    }

    if (mappedRules.some((rule) => Number.isNaN(rule.value) || rule.value < 0)) {
      toast({
        variant: "destructive",
        description: "Rule values must be valid positive numbers.",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/payrolls/policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          currency: currency.trim().toUpperCase(),
          effectiveFrom,
          notes: notes.trim() || null,
          rules: mappedRules,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to save policy.");
      }

      toast({
        description: payload?.message || "Payroll policy updated.",
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to save policy.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="policy-name">Policy name</Label>
          <Input
            id="policy-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!canEdit || saving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="policy-currency">Currency</Label>
          <Input
            id="policy-currency"
            maxLength={3}
            value={currency}
            onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            disabled={!canEdit || saving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="policy-effective-from">Effective from</Label>
          <Input
            id="policy-effective-from"
            type="date"
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
            disabled={!canEdit || saving}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="policy-notes">Notes</Label>
        <Textarea
          id="policy-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={!canEdit || saving}
          placeholder="Optional policy notes"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Policy rules</h3>
          <Button type="button" variant="outline" onClick={addRule} disabled={!canEdit || saving}>
            Add Rule
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Value type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Min</TableHead>
                <TableHead>Max</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule, index) => (
                <TableRow key={`${rule.kind}-${index}`}>
                  <TableCell>
                    <Input
                      value={rule.label}
                      onChange={(event) => updateRule(index, { label: event.target.value })}
                      disabled={!canEdit || saving}
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      className="h-9 w-full rounded-md border px-2 text-sm"
                      value={rule.kind}
                      onChange={(event) =>
                        updateRule(index, { kind: event.target.value as PayrollPolicyRuleKind })
                      }
                      disabled={!canEdit || saving}
                    >
                      {ruleKinds.map((kind) => (
                        <option key={kind} value={kind}>
                          {kind}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <select
                      className="h-9 w-full rounded-md border px-2 text-sm"
                      value={rule.valueType}
                      onChange={(event) =>
                        updateRule(index, {
                          valueType: event.target.value as PayrollPolicyRuleValueType,
                        })
                      }
                      disabled={!canEdit || saving}
                    >
                      {ruleValueTypes.map((valueType) => (
                        <option key={valueType} value={valueType}>
                          {valueType}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      inputMode="decimal"
                      value={rule.value}
                      onChange={(event) => updateRule(index, { value: event.target.value })}
                      disabled={!canEdit || saving}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      inputMode="decimal"
                      value={rule.minAmount}
                      onChange={(event) => updateRule(index, { minAmount: event.target.value })}
                      disabled={!canEdit || saving}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      inputMode="decimal"
                      value={rule.maxAmount}
                      onChange={(event) => updateRule(index, { maxAmount: event.target.value })}
                      disabled={!canEdit || saving}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={rule.isActive}
                      onCheckedChange={(checked) =>
                        updateRule(index, { isActive: checked === true })
                      }
                      disabled={!canEdit || saving}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeRule(index)}
                      disabled={!canEdit || saving || rules.length <= 1}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={savePolicy} disabled={!canEdit || saving}>
          {saving ? "Saving..." : "Save Policy"}
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border p-4">
        <h3 className="text-sm font-semibold text-slate-900">Policy history</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Effective To</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No policy versions yet.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>v{row.version}</TableCell>
                    <TableCell className={statusClass(row.status)}>{row.status}</TableCell>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell>{formatDate(row.effectiveFrom)}</TableCell>
                    <TableCell>{row.effectiveTo ? formatDate(row.effectiveTo) : "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

