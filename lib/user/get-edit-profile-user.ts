import { prisma } from "@/db/prisma";
import { Prisma } from "@prisma/client";

const editProfileUserSelect = Prisma.validator<Prisma.UserSelect>()({
  role: true,
  name: true,
  fullName: true,
  firstName: true,
  lastName: true,
  email: true,
  country: true,
  postCode: true,
  address: true,
  about: true,
  linkedIn: true,
  hobbies: true,
  superpowers: true,
  mostFascinatingTrip: true,
  dreamTravelDestination: true,
  dateOfBirth: true,
  accountName: true,
  accountNumber: true,
  swiftCode: true,
  iban: true,
  sortCode: true,
  workEligibility: true,
  position: true,
  employmentType: true,
  originalCompany: true,
  hireDate: true,
  officeLocation: true,
  onboardingLocation: true,
  onboardingTravel: true,
  orgLevel: true,
  department: {
    select: {
      departmentName: true,
    },
  },
  manager: {
    select: {
      fullName: true,
      name: true,
      email: true,
    },
  },
  secondLevelManager: {
    select: {
      fullName: true,
      name: true,
      email: true,
    },
  },
});

export type EditProfileUser = Prisma.UserGetPayload<{
  select: typeof editProfileUserSelect;
}>;

export async function getEditProfileUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: editProfileUserSelect,
  });
}
