"use client";

import * as React from "react";
import { z } from "zod";
import { type UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateUserSchema } from "@/lib/validators";

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export type Option = {
  id: string;
  name: string;
};

export type ManagerOption = {
  id: string;
  label: string;
};

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getWorkAnniversaryLabel(startDate?: string) {
  if (!startDate) return "";

  const parsed = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";

  const today = new Date();
  const currentYear = today.getFullYear();
  const thisYearAnniversary = new Date(
    currentYear,
    parsed.getMonth(),
    parsed.getDate(),
  );
  const nextAnniversary =
    thisYearAnniversary >=
    new Date(today.getFullYear(), today.getMonth(), today.getDate())
      ? thisYearAnniversary
      : new Date(currentYear + 1, parsed.getMonth(), parsed.getDate());

  const completedYears =
    nextAnniversary.getFullYear() - parsed.getFullYear() - 1;

  return `${nextAnniversary.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}${completedYears >= 0 ? ` (${completedYears + 1} year${completedYears + 1 === 1 ? "" : "s"})` : ""}`;
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function TextField({
  form,
  name,
  label,
  placeholder,
  type = "text",
  disabled = false,
}: {
  form: UseFormReturn<UpdateUserFormValues>;
  name: keyof UpdateUserFormValues;
  label: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type={type}
              disabled={disabled}
              placeholder={placeholder}
              value={(field.value as string | null | undefined) ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function TextAreaField({
  form,
  name,
  label,
  placeholder,
  rows = 4,
  className,
}: {
  form: UseFormReturn<UpdateUserFormValues>;
  name: keyof UpdateUserFormValues;
  label: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormItem className={className ?? "w-full"}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              rows={rows}
              placeholder={placeholder}
              value={(field.value as string | null | undefined) ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
