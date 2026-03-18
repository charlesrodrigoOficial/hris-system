"use client";

import * as React from "react";
import { type Country, type EmploymentType, type UserRole } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ProfileUserData = {
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  country: Country | null;
  postCode: string | null;
  address: string | null;
  about: string | null;
  linkedIn: string | null;
  hobbies: string | null;
  superpowers: string | null;
  mostFascinatingTrip: string | null;
  dreamTravelDestination: string | null;
  dateOfBirth: Date | null;
  accountName: string | null;
  accountNumber: string | null;
  swiftCode: string | null;
  iban: string | null;
  sortCode: string | null;
  workEligibility: string | null;
  position: string | null;
  departmentName: string | null;
  employmentType: EmploymentType | null;
  originalCompany: string | null;
  hireDate: Date | null;
  officeLocation: string | null;
  onboardingLocation: string | null;
  onboardingTravel: string | null;
  orgLevel: string | null;
  managerName: string | null;
  secondLevelManagerName: string | null;
};

export function formatEnumLabel(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getWorkAnniversaryLabel(startDate?: Date | null) {
  if (!startDate) return "";

  const parsed = new Date(startDate);
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

export function ReadOnlyField({
  label,
  value,
  type = "text",
}: {
  label: string;
  value?: string | null;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value ?? ""}
        type={type}
        readOnly
        className="bg-slate-50 text-slate-900"
      />
    </div>
  );
}

export function ReadOnlyTextArea({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <Textarea
        value={value ?? ""}
        readOnly
        className="bg-slate-50 text-slate-900"
      />
    </div>
  );
}
