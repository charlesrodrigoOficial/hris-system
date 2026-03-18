"use client";

import { ReadOnlyField, Section, type ProfileUserData } from "./card-shared";

export function BankingDetailsCard({ user }: { user: ProfileUserData }) {
  return (
    <Section
      title="Banking Details"
      description="Payroll and bank details are visible here for reference and can only be updated by admin."
    >
      <ReadOnlyField label="Account name" value={user.accountName} />
      <ReadOnlyField label="Account number" value={user.accountNumber} />
      <ReadOnlyField label="SWIFT code" value={user.swiftCode} />
      <ReadOnlyField label="IBAN" value={user.iban} />
      <ReadOnlyField label="Sort code" value={user.sortCode} />
    </Section>
  );
}
