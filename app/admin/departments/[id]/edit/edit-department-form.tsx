"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { updateDepartment } from "@/lib/actions/department.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EmployeeOption = {
  id: string;
  fullName: string | null;
  name: string | null;
  email: string | null;
};

export default function EditDepartmentForm(props: {
  department: {
    id: string;
    departmentName: string;
    depManagerId: string | null;
  };
  employees: EmployeeOption[];
}) {
  const { department, employees } = props;
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const res = await updateDepartment(formData);

      if (!res.success) {
        toast({ variant: "destructive", description: res.message });
        return;
      }

      toast({ description: res.message });
      router.push("/admin/departments");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={department.id} />

      <div className="space-y-2">
        <label className="text-sm font-medium">Department Name</label>
        <Input
          name="departmentName"
          defaultValue={department.departmentName}
          placeholder="Enter department name"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Department Manager</label>
        <select
          name="depManagerId"
          defaultValue={department.depManagerId ?? ""}
          className="w-full rounded-md border px-3 py-2 text-sm"
          disabled={isPending}
        >
          <option value="">No manager assigned</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.fullName ?? employee.name ?? employee.email}{" "}
              {employee.email ? `- ${employee.email}` : ""}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}

