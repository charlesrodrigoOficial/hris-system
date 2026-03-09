import { createDepartment } from "@/lib/actions/department.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewDepartmentPage() {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Create Department</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createDepartment} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Department Name</label>
            <Input
              name="departmentName"
              placeholder="Enter department name"
            />
          </div>

          <Button type="submit">Create Department</Button>
        </form>
      </CardContent>
    </Card>
  );
}
