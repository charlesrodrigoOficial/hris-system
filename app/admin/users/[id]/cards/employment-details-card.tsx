"use client";

import { EmploymentType } from "@prisma/client";
import { type UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatEnumLabel,
  getWorkAnniversaryLabel,
  Section,
  TextField,
  type ManagerOption,
  type Option,
  type UpdateUserFormValues,
} from "./card-shared";

const employmentTypes = Object.values(EmploymentType);

export function EmploymentDetailsCard({
  form,
  departments,
  managers,
  startDate,
}: {
  form: UseFormReturn<UpdateUserFormValues>;
  departments: Option[];
  managers: ManagerOption[];
  startDate?: string;
}) {
  return (
    <Section
      title="Employment Details"
      description="Manage department, reporting lines, onboarding data, and the fields used for employee administration."
    >
      <TextField
        form={form}
        name="workEligibility"
        label="Work eligibility"
        placeholder="Enter work eligibility"
      />
      <TextField
        form={form}
        name="position"
        label="Position"
        placeholder="Enter position"
      />

      <FormField
        control={form.control}
        name="departmentId"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Department</FormLabel>
            <Select
              onValueChange={(value) =>
                field.onChange(value === "NONE" ? "" : value)
              }
              value={field.value || "NONE"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="NONE">No department selected</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
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
        name="employmentType"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Hire type</FormLabel>
            <Select
              onValueChange={(value) =>
                field.onChange(
                  value === "NONE" ? null : (value as EmploymentType),
                )
              }
              value={field.value ?? "NONE"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select hire type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="NONE">Not set</SelectItem>
                {employmentTypes.map((employmentType) => (
                  <SelectItem key={employmentType} value={employmentType}>
                    {formatEnumLabel(employmentType)}
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
        name="originalCompany"
        label="Original company"
        placeholder="Enter original company"
      />
      <TextField
        form={form}
        name="officeLocation"
        label="Office location"
        placeholder="Enter office location"
      />
      <TextField
        form={form}
        name="onboardingLocation"
        label="Onboarding location"
        placeholder="Enter onboarding location"
      />
      <TextField
        form={form}
        name="onboardingTravel"
        label="Onboarding travel"
        placeholder="Enter onboarding travel details"
      />
      <TextField
        form={form}
        name="orgLevel"
        label="Org level"
        placeholder="Enter org level"
      />
      <TextField
        form={form}
        name="startDate"
        label="Start date"
        type="date"
      />

      <div className="space-y-2">
        <FormLabel>Work anniversary</FormLabel>
        <Input
          value={getWorkAnniversaryLabel(startDate)}
          readOnly
          disabled
          placeholder="Calculated from start date"
        />
      </div>

      <FormField
        control={form.control}
        name="managerId"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Manager</FormLabel>
            <Select
              onValueChange={(value) =>
                field.onChange(value === "NONE" ? "" : value)
              }
              value={field.value || "NONE"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="NONE">No manager assigned</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.label}
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
        name="secondLevelManagerId"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Second level manager</FormLabel>
            <Select
              onValueChange={(value) =>
                field.onChange(value === "NONE" ? "" : value)
              }
              value={field.value || "NONE"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select second level manager" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="NONE">
                  No second level manager assigned
                </SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </Section>
  );
}
