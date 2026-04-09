import { Metadata } from "next";
import { deleteUser, getAllUsers } from "@/lib/actions/user.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatId, formatDateTime, formatCurreny } from "@/lib/utils";
import Link from "next/link"
import Pagination from "@/components/shared/header/pagination";
import { Badge } from "@/components/ui/badge";
import DeleteDialog from "@/components/shared/delete-dialog";
import { UserRole } from "@prisma/client";
import { formatUserRoleLabel } from "@/lib/user/role-label";
import { requireAdminPermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Admin Users",
};

function roleBadgeClass(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "border-red-200 bg-red-100 text-red-800";
    case "HR":
      return "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-800";
    case "MANAGER":
      return "border-amber-200 bg-amber-100 text-amber-800";
    case "FINANCE":
      return "border-emerald-200 bg-emerald-100 text-emerald-800";
    case "ANALYST":
      return "border-cyan-200 bg-cyan-100 text-cyan-800";
    case "EMPLOYEE":
      return "border-blue-200 bg-blue-100 text-blue-800";
    case "USER":
    default:
      return "border-slate-200 bg-slate-100 text-slate-800";
  }
}

const AdminUserPage = async (props: {
  searchParams: Promise<{
    page: string;
  }>;
}) => {
  await requireAdminPermission("roles:assign");
  const { page = "1" } = await props.searchParams;

  const users = await getAllUsers({ page: Number(page) });


  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <h1 className="h2-bold">Users</h1>
        {/* {searchText && (
          <div>
            Filtered by <i>&quot;{searchText}&quot;</i>{" "}
            <Link href="/admin/orders">
              <Button variant="outline" size="sm">
                Remove Filter
              </Button>
            </Link>
          </div>
        )} */}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.data.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{formatId(user.id)}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={roleBadgeClass(user.role)}>
                    {formatUserRoleLabel(user.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/users/${user.id}`}>Edit</Link>
                  </Button>
                  <DeleteDialog id={user.id} action={deleteUser} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.totalPages > 1 && (
          <Pagination
            page={Number(page) || 1}
            totalPages={users?.totalPages}
          ></Pagination>
        )}
      </div>
    </div>
  );
};

export default AdminUserPage;
