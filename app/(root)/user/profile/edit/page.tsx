import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileForm from "../profile-form";
import { getEditProfileUser } from "@/lib/user/get-edit-profile-user";

function splitName(
  firstName?: string | null,
  lastName?: string | null,
  fullName?: string | null,
) {
  if (firstName || lastName) {
    return {
      firstName: firstName ?? "",
      lastName: lastName ?? "",
    };
  }

  const trimmed = fullName?.trim() ?? "";
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const [head, ...tail] = trimmed.split(/\s+/);
  return {
    firstName: head ?? "",
    lastName: tail.join(" "),
  };
}

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await getEditProfileUser(session.user.id);

  if (!user) {
    redirect("/sign-in");
  }

  const { firstName, lastName } = splitName(
    user.firstName,
    user.lastName,
    user.fullName ?? user.name,
  );

  const managerLabel = user.manager
    ? user.manager.fullName ?? user.manager.name ?? user.manager.email
    : "";
  const secondLevelManagerLabel = user.secondLevelManager
    ? user.secondLevelManager.fullName ??
      user.secondLevelManager.name ??
      user.secondLevelManager.email
    : "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Card className="rounded-lg border-slate-200 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            user={{
              role: user.role,
              firstName,
              lastName,
              email: user.email,
              country: user.country,
              postCode: user.postCode,
              address: user.address,
              about: user.about,
              linkedIn: user.linkedIn,
              hobbies: user.hobbies,
              superpowers: user.superpowers,
              mostFascinatingTrip: user.mostFascinatingTrip,
              dreamTravelDestination: user.dreamTravelDestination,
              dateOfBirth: user.dateOfBirth,
              accountName: user.accountName,
              accountNumber: user.accountNumber,
              swiftCode: user.swiftCode,
              iban: user.iban,
              sortCode: user.sortCode,
              workEligibility: user.workEligibility,
              position: user.position,
              departmentName: user.department?.departmentName ?? null,
              employmentType: user.employmentType,
              originalCompany: user.originalCompany,
              hireDate: user.hireDate,
              officeLocation: user.officeLocation,
              onboardingLocation: user.onboardingLocation,
              onboardingTravel: user.onboardingTravel,
              orgLevel: user.orgLevel,
              managerName: managerLabel,
              secondLevelManagerName: secondLevelManagerLabel,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
