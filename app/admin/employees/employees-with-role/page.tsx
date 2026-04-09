import { Metadata } from "next"
import EmployeeWithRole from "./employee-with-role";
import { requireAdminPermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Employee details",
};

const AllEmployeeWithRole = async () => {
    await requireAdminPermission("users:view");
    return (<EmployeeWithRole/>
     );
}
 
export default AllEmployeeWithRole;
