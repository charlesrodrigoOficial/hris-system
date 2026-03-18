"use client";

import {
  formatEnumLabel,
  getWorkAnniversaryLabel,
  ReadOnlyField,
  Section,
  type ProfileUserData,
} from "./card-shared";

export function EmploymentDetailsCard({ user }: { user: ProfileUserData }) {
  return (
    <Section
      title="Employment Details"
      description="Employment and reporting details are supplied by admin and shown here as read-only."
    >
      <ReadOnlyField label="Work eligibility" value={user.workEligibility} />
      <ReadOnlyField label="Position" value={user.position} />
      <ReadOnlyField label="Department" value={user.departmentName} />
      <ReadOnlyField
        label="Hire type"
        value={formatEnumLabel(user.employmentType)}
      />
      <ReadOnlyField
        label="Original company"
        value={user.originalCompany}
      />
      <ReadOnlyField label="Office location" value={user.officeLocation} />
      <ReadOnlyField
        label="Onboarding location"
        value={user.onboardingLocation}
      />
      <ReadOnlyField
        label="Onboarding travel"
        value={user.onboardingTravel}
      />
      <ReadOnlyField label="Org level" value={user.orgLevel} />
      <ReadOnlyField
        label="Start date"
        value={user.hireDate?.toISOString().slice(0, 10) ?? ""}
        type="date"
      />
      <ReadOnlyField
        label="Work anniversary"
        value={getWorkAnniversaryLabel(user.hireDate)}
      />
      <ReadOnlyField label="Manager" value={user.managerName} />
      <ReadOnlyField
        label="Second level manager"
        value={user.secondLevelManagerName}
      />
    </Section>
  );
}
