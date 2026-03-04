import { z } from "zod";
import { formatNumberWithDecimal } from "./utils";
import { PAYMENT_METHODS } from "./constants";
import { Country, UserRole } from "@prisma/client";

//Schema for signing users in
export const signInFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 charachters"),
});

//Schema for signUp users in
export const signUpFormSchema = z
  .object({
    name: z.string().min(3, "Name should be at least 3 charachters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 charachters"),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 charachters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password don't match",
    path: ["confirmPassword"],
  });

//Schema for updating the user profile
export const updateProfileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").nullable(),
  email: z.string().min(3, "Email must be at least 3 characters").nullable(),
});

//Schema to update user
export const updateUserSchema = updateProfileSchema.extend({
  id: z.string().min(1, "ID is required"),
  role: z.nativeEnum(UserRole),
  country: z.nativeEnum(Country).nullable().optional(),
});

// ✅ Schema for admin create user (same as signup form)
export const createUserSchema = signUpFormSchema.and(
  z.object({
    role: z.nativeEnum(UserRole).optional(), // default in action
    country: z.nativeEnum(Country).nullable().optional(),
  })
);