"use server";

import {
  createUserSchema,
  signInFormSchema,
  signUpFormSchema,
  updateProfileSchema,
  updateUserSchema,
} from "../validators";
import { auth, signIn, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { hashSync } from "bcrypt-ts-edge";
import { prisma } from "@/db/prisma";
import { UserRole } from "@prisma/client";
import { formatError } from "../utils";
// import { ShippingAddress } from "@/types";
import z from "zod";
import { _success } from "zod/v4/core";
import { PAGE_SIZE } from "../constants";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { normalizeRelativeCallbackUrl } from "../auth/redirects";

function getRedirectTo(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl");
  return normalizeRelativeCallbackUrl(
    typeof callbackUrl === "string" ? callbackUrl : null,
  );
}

//Sign in the user with credentials
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData,
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    const redirectTo = getRedirectTo(formData);

    await signIn("credentials", {
      ...user,
      redirectTo,
    });

    return { success: true, message: "Signed in success" };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: "Invalid email or password" };
  }
}

//sign user out
export async function signOutUser() {
  await signOut();
}

//Sign up User
export async function signUpUser(prevState: unknown, formData: FormData) {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const plainPassword = user.password;
    const redirectTo = getRedirectTo(formData);

    user.password = hashSync(user.password, 10);

    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
      },
    });

    await signIn("credentials", {
      email: user.email,
      password: plainPassword,
      redirectTo,
    });

    return { success: true, message: "User registered  successfully" };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: formatError(error) };
  }
}

//Get user by ID
export async function getUserById(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });
  if (!user) throw new Error("User not found");
  return user;
}

//Update the user profile
export async function updateProfile(prevState: unknown, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Not authenticated" };
    }

    const parsed = updateProfileSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      about: formData.get("about"),
      linkedIn: formData.get("linkedIn"),
      hobbies: formData.get("hobbies"),
      superpowers: formData.get("superpowers"),
      mostFascinatingTrip: formData.get("mostFascinatingTrip"),
      dreamTravelDestination: formData.get("dreamTravelDestination"),
      dateOfBirth: formData.get("dateOfBirth"),
    });

    const currentUser = await prisma.user.findFirst({
      where: {
        id: session?.user?.id,
      },
    });
    if (!currentUser) throw new Error("User not found");

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        name: parsed.name,
        about: emptyToNull(parsed.about),
        linkedIn: emptyToNull(parsed.linkedIn),
        hobbies: emptyToNull(parsed.hobbies),
        superpowers: emptyToNull(parsed.superpowers),
        mostFascinatingTrip: emptyToNull(parsed.mostFascinatingTrip),
        dreamTravelDestination: emptyToNull(parsed.dreamTravelDestination),
        dateOfBirth: parsed.dateOfBirth
          ? new Date(`${parsed.dateOfBirth}T00:00:00.000Z`)
          : null,
      },
    });

    revalidatePath("/");
    revalidatePath("/user/profile");
    revalidatePath("/user/profile/edit");

    return {
      success: true,
      message: "Profile updated successfully",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

function emptyToNull(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

//Get all Users
export async function getAllUsers({
  limit = PAGE_SIZE,
  page,
  // query,
}: {
  limit?: number;
  page: number;
  // query: string;
}) {
  // const queryFilter: Prisma.UserWhereInput =
  //   query && query !== "all"
  //     ? {
  //         name: {
  //           contains: query,
  //           mode: "insensitive",
  //         } as Prisma.StringFilter,
  //       }
      // : {};

  const data = await prisma.user.findMany({
    // where: {
    //   ...queryFilter,
    // },

    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.user.count();

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

//Delete a user
export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

//Update a user
export async function updateUser(user: z.infer<typeof updateUserSchema>) {
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        role: user.role, //must be a enum role
        country: user.country ?? null,
      },
    });

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User update successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function createUser(prevState: unknown, formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, message: "Not authenticated" };
    }

    // ✅ RBAC (adjust if your role field name differs)
    const actorRole = (session.user as any).role as string | undefined;
    if (!["ADMIN", "HR"].includes(actorRole ?? "")) {
      return { success: false, message: "Not authorized" };
    }

    // ✅ Validate formData
    const parsed = createUserSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      // future: role/country from form if you add
      role: formData.get("role") ?? undefined,
      country: formData.get("country") ?? undefined,
    });

    // ✅ check duplicate email
    const exists = await prisma.user.findUnique({
      where: { email: parsed.email },
      select: { id: true },
    });

    if (exists) {
      return { success: false, message: "Email already exists" };
    }

    // ✅ hash password
    const hashedPassword = hashSync(parsed.password, 10);

    // ✅ create user
    await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: hashedPassword, // IMPORTANT: your User model must have password
        ...(parsed.role ? { role: parsed.role } : {}),
        ...(parsed.country !== undefined ? { country: parsed.country } : {}),
      } as any,
    });

    // ✅ refresh users list page
    revalidatePath("/admin/users");

    return { success: true, message: "User created successfully" };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, message: formatError(error) };
  }
}
