import { Metadata } from "next"
import EmployeeData from "./employee-data";
import { requireAdminPermission } from "@/lib/auth/guards";


export const metadata: Metadata = {
  title: "Employee details",
};

const EmployeePage = async () => {
    await requireAdminPermission("users:view");
    return (<EmployeeData/>
      
     );
}
 
export default EmployeePage;
