"use client";

import { Country, UserRole } from "@prisma/client";
import { type ControllerRenderProps, type UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USER_ROLES } from "@/lib/constants";
import {
  formatEnumLabel,
  Section,
  TextAreaField,
  TextField,
  type UpdateUserFormValues,
} from "./card-shared";

export function PersonalDetailsCard({
  form,
}: {
  form: UseFormReturn<UpdateUserFormValues>;
}) {
  return (
    <Section
      title="Personal Details"
      description="Update the core profile and residence details used across the admin area."
    >
      <TextField
        form={form}
        name="firstName"
        label="First name"
        placeholder="Enter first name"
      />
      <TextField
        form={form}
        name="lastName"
        label="Last name"
        placeholder="Enter last name"
      />
      <TextField
        form={form}
        name="email"
        label="Email"
        type="email"
        placeholder="name@company.com"
      />

      <FormField
        control={form.control}
        name="role"
        render={({
          field,
        }: {
          field: ControllerRenderProps<UpdateUserFormValues, "role">;
        }) => (
          <FormItem className="w-full">
            <FormLabel>Role</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(value as UserRole)}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatEnumLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="country"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Country of residence</FormLabel>
            <Select
              onValueChange={(value) =>
                field.onChange(value === "NONE" ? null : (value as Country))
              }
              value={field.value ?? "NONE"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                {Object.values(Country).map((country) => (
                  <SelectItem key={country} value={country}>
                    {country.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <TextField
        form={form}
        name="postCode"
        label="Post code"
        placeholder="Enter post code"
      />

      <TextAreaField
        form={form}
        name="address"
        label="Address"
        rows={4}
        placeholder="Enter residential address"
        className="md:col-span-2"
      />
    </Section>
  );
}
