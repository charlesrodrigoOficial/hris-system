import { DefaultSession } from "next-auth";

declare module "next-auth" {
  export interface Session {
    user: {
      id: string;
      role: string;
      dateOfBirth?: Date | null;
    } & DefaultSession["user"];
  }

   interface User {
    id: string;
    role: UserRole;
    departmentId?: string | null;
    country?: Country | null;
  }
}