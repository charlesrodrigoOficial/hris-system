"use client";

import { ReadOnlyField, ReadOnlyTextArea, Section, type ProfileUserData } from "./card-shared";

export function PersonalDetailsCard({ user }: { user: ProfileUserData }) {
  return (
    <Section
      title="Personal Details"
      description="Personal details are shown here for reference and can only be updated by admin."
    >
      <ReadOnlyField label="First name" value={user.firstName} />
      <ReadOnlyField label="Last name" value={user.lastName} />
      <ReadOnlyField label="Email" value={user.email} type="email" />
      <ReadOnlyField
        label="Country of residence"
        value={user.country?.replaceAll("_", " ") ?? ""}
      />
      <ReadOnlyField label="Post code" value={user.postCode} />
      <ReadOnlyTextArea
        label="Address"
        value={user.address}
        className="md:col-span-2"
      />
    </Section>
  );
}
