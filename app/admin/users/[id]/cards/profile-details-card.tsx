"use client";

import { type UseFormReturn } from "react-hook-form";
import {
  Section,
  TextAreaField,
  TextField,
  type UpdateUserFormValues,
} from "./card-shared";

export function ProfileDetailsCard({
  form,
}: {
  form: UseFormReturn<UpdateUserFormValues>;
}) {
  return (
    <Section
      title="Profile Details"
      description="Add the personal profile information shown on the employee-facing profile page."
    >
      <TextAreaField
        form={form}
        name="about"
        label="About"
        rows={4}
        placeholder="Write a short introduction"
        className="md:col-span-2"
      />
      <TextField
        form={form}
        name="linkedIn"
        label="LinkedIn"
        type="url"
        placeholder="https://linkedin.com/in/your-profile"
      />
      <TextField
        form={form}
        name="dateOfBirth"
        label="Date of Birth"
        type="date"
      />
      <TextAreaField
        form={form}
        name="hobbies"
        label="Hobbies"
        rows={4}
        placeholder="Reading, football, photography..."
      />
      <TextAreaField
        form={form}
        name="superpowers"
        label="Superpowers"
        rows={4}
        placeholder="What are they exceptionally good at?"
      />
      <TextAreaField
        form={form}
        name="mostFascinatingTrip"
        label="Most Fascinating Trip"
        rows={4}
        placeholder="Tell us about a memorable trip"
      />
      <TextField
        form={form}
        name="dreamTravelDestination"
        label="Dream Travel Destination"
        placeholder="Japan, Iceland, New Zealand..."
      />
    </Section>
  );
}
