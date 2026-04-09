import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import CreateUserForm from "./create-user-form";
import { requireAdminPermission } from "@/lib/auth/guards";



const AddUserPage = async (props: {
  searchParams: Promise<{
    callbackUrl: string;
  }>;
}) => {
  await requireAdminPermission("users:create");

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-4">
          
          <CardTitle className="text-center"> Create User </CardTitle>
          <CardDescription className="text-center">
            Enter your information below to sign up
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CreateUserForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default AddUserPage;
