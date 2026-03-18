"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Section, type ProfileUserData } from "./card-shared";

export function ProfileDetailsCard({ user }: { user: ProfileUserData }) {
  return (
    <Section
      title="Profile Details"
      description="Employees can edit their own profile, bio, and personal interest fields here."
    >
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="about">About</Label>
        <Textarea
          id="about"
          name="about"
          defaultValue={user.about ?? ""}
          placeholder="Write a short introduction"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="linkedIn">LinkedIn</Label>
        <Input
          id="linkedIn"
          name="linkedIn"
          type="url"
          defaultValue={user.linkedIn ?? ""}
          placeholder="https://linkedin.com/in/your-profile"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          defaultValue={user.dateOfBirth?.toISOString().slice(0, 10) ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hobbies">Hobbies</Label>
        <Textarea
          id="hobbies"
          name="hobbies"
          defaultValue={user.hobbies ?? ""}
          placeholder="Reading, football, photography..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="superpowers">Superpowers</Label>
        <Textarea
          id="superpowers"
          name="superpowers"
          defaultValue={user.superpowers ?? ""}
          placeholder="What are you exceptionally good at?"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mostFascinatingTrip">Most Fascinating Trip</Label>
        <Textarea
          id="mostFascinatingTrip"
          name="mostFascinatingTrip"
          defaultValue={user.mostFascinatingTrip ?? ""}
          placeholder="Tell us about a memorable trip"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dreamTravelDestination">Dream Travel Destination</Label>
        <Input
          id="dreamTravelDestination"
          name="dreamTravelDestination"
          defaultValue={user.dreamTravelDestination ?? ""}
          placeholder="Japan, Iceland, New Zealand..."
        />
      </div>
    </Section>
  );
}
