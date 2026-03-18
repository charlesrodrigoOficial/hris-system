import { z } from "zod";
import { formatNumberWithDecimal } from "./utils";
import { PAYMENT_METHODS } from "./constants";
import { Country, EmploymentType, UserRole } from "@prisma/client";

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
const optionalProfileText = z.string().trim().max(1000).optional();
const optionalProfileLink = z
  .string()
  .trim()
  .url("Enter a valid LinkedIn URL")
  .or(z.literal(""))
  .optional();
const optionalProfileDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
  .or(z.literal(""))
  .optional();
const optionalAdminText = z.string().trim().max(255).optional();
const optionalAdminLongText = z.string().trim().max(1000).optional();
const optionalAdminDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
  .or(z.literal(""))
  .optional();
const optionalUuid = z
  .string()
  .uuid("Select a valid option")
  .or(z.literal(""))
  .optional();

const updateBasicUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().trim().email("Enter a valid email"),
});

export const updateProfileSchema = updateBasicUserSchema.extend({
  about: optionalProfileText,
  linkedIn: optionalProfileLink,
  hobbies: optionalProfileText,
  superpowers: optionalProfileText,
  mostFascinatingTrip: optionalProfileText,
  dreamTravelDestination: z.string().trim().max(255).optional(),
  dateOfBirth: optionalProfileDate,
});

//Schema to update user
export const updateUserSchema = z
  .object({
  id: z.string().min(1, "ID is required"),
  email: z.string().trim().email("Enter a valid email"),
  role: z.nativeEnum(UserRole),
  firstName: optionalAdminText,
  lastName: optionalAdminText,
  about: optionalAdminLongText,
  linkedIn: optionalProfileLink,
  dateOfBirth: optionalAdminDate,
  hobbies: optionalAdminLongText,
  superpowers: optionalAdminLongText,
  mostFascinatingTrip: optionalAdminLongText,
  dreamTravelDestination: optionalAdminText,
  postCode: optionalAdminText,
  country: z.nativeEnum(Country).nullable().optional(),
  address: optionalAdminLongText,
  accountName: optionalAdminText,
  accountNumber: optionalAdminText,
  swiftCode: optionalAdminText,
  iban: optionalAdminText,
  sortCode: optionalAdminText,
  workEligibility: optionalAdminText,
  position: optionalAdminText,
  departmentId: optionalUuid,
  employmentType: z.nativeEnum(EmploymentType).nullable().optional(),
  originalCompany: optionalAdminText,
  startDate: optionalAdminDate,
  officeLocation: optionalAdminText,
  onboardingLocation: optionalAdminText,
  onboardingTravel: optionalAdminText,
  orgLevel: optionalAdminText,
  managerId: optionalUuid,
  secondLevelManagerId: optionalUuid,
})
  .superRefine((data, ctx) => {
    if (
      data.managerId &&
      data.secondLevelManagerId &&
      data.managerId === data.secondLevelManagerId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Manager and second level manager must be different",
        path: ["secondLevelManagerId"],
      });
    }
  });

// ✅ Schema for admin create user (same as signup form)
export const createUserSchema = signUpFormSchema.and(
  z.object({
    role: z.nativeEnum(UserRole).optional(), // default in action
    country: z.nativeEnum(Country).nullable().optional(),
  })
);
