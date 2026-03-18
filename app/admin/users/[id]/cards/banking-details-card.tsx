"use client";

import { type UseFormReturn } from "react-hook-form";
import {
  Section,
  TextField,
  type UpdateUserFormValues,
} from "./card-shared";

export function BankingDetailsCard({
  form,
}: {
  form: UseFormReturn<UpdateUserFormValues>;
}) {
  return (
    <Section
      title="Banking Details"
      description="Capture the payroll and transfer details needed for finance and HR operations."
    >
      <TextField
        form={form}
        name="accountName"
        label="Account name"
        placeholder="Enter account name"
      />
      <TextField
        form={form}
        name="accountNumber"
        label="Account number"
        placeholder="Enter account number"
      />
      <TextField
        form={form}
        name="swiftCode"
        label="SWIFT code"
        placeholder="Enter SWIFT code"
      />
      <TextField
        form={form}
        name="iban"
        label="IBAN"
        placeholder="Enter IBAN"
      />
      <TextField
        form={form}
        name="sortCode"
        label="Sort code"
        placeholder="Enter sort code"
      />
    </Section>
  );
}
