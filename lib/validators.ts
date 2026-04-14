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
const optionalSalary = z
  .string()
  .trim()
  .regex(
    /^$|^\d{1,9}(\.\d{1,2})?$/,
    "Enter a valid monthly salary (up to 2 decimal places)",
  )
  .optional();
const optionalCurrencyCode = z
  .string()
  .trim()
  .regex(/^$|^[A-Za-z]{3}$/, "Use a 3-letter currency code (e.g. GBP)")
  .optional();
const optionalUuid = z
  .string()
  .uuid("Select a valid option")
  .or(z.literal(""))
  .optional();
  
const optionalImageUrl = z.string().trim().max(2048).or(z.literal("")).optional();

const countryOfResidenceSchema = z
  .union([z.nativeEnum(Country), z.literal("INDONESIA"), z.literal("THAILAND")])
  .transform((value) => value as unknown as Country);

const updateBasicUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().trim().email("Enter a valid email"),
});

export const updateProfileSchema = updateBasicUserSchema.extend({
  image: optionalImageUrl,
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
  image: optionalImageUrl,
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
  country: countryOfResidenceSchema.nullable().optional(),
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
  salary: optionalSalary,
  currency: optionalCurrencyCode,
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
    country: countryOfResidenceSchema.nullable().optional(),
  })
);

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmNewPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"],
  });
