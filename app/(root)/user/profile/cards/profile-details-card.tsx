"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Section, type ProfileUserData } from "./card-shared";

export function ProfileDetailsCard({
  user,
  image,
  onImageChange,
}: {
  user: ProfileUserData;
  image: string;
  onImageChange: (next: string) => void;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [image]);

  const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const uploadImage = async (file: File | null) => {
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast({
        variant: "destructive",
        description: "Please upload a PNG, JPG, or WEBP image.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        description: "Image must be 5MB or smaller.",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/user/profile/upload-image", {
        method: "POST",
        body: formData,
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || "Failed to upload image.");
      }

      onImageChange(String(body.url || ""));
      toast({ description: "Image uploaded. Click Save Profile Details to apply." });
    } catch (error) {
      toast({
        variant: "destructive",
        description: (error as Error).message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Section
      title="Profile Details"
      description="Employees can edit their own profile, bio, and personal interest fields here."
    >
      <div className="space-y-2 md:col-span-2">
        <Label>Profile image</Label>
        <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl border bg-muted">
              {image && !imageFailed ? (
                <img
                  src={image}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                  {initials || "?"}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium">Upload a new photo</p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, or WEBP • max 5MB
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading}
              onChange={async (event) => {
                const file = event.target.files?.[0] ?? null;
                event.target.value = "";
                await uploadImage(file);
              }}
              className="sm:max-w-[260px]"
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading || !image}
              onClick={() => onImageChange("")}
            >
              Remove
            </Button>
          </div>
        </div>
      </div>

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
