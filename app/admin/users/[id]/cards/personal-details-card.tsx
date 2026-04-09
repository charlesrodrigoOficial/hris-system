"use client";

import * as React from "react";
import { Country, UserRole } from "@prisma/client";
import { type ControllerRenderProps, type UseFormReturn, useWatch } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES } from "@/lib/constants";
import { formatUserRoleLabel } from "@/lib/user/role-label";
import {
  Section,
  TextAreaField,
  TextField,
  type UpdateUserFormValues,
} from "./card-shared";

export function PersonalDetailsCard({
  form,
}: {
  form: UseFormReturn<UpdateUserFormValues>;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);
  const [imageFailed, setImageFailed] = React.useState(false);

  const imageUrl = useWatch({
    control: form.control,
    name: "image",
  });

  React.useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const countryOptions = Array.from(
    new Set([...Object.values(Country), "INDONESIA", "THAILAND"]),
  );

  const displayName = [
    form.getValues("firstName"),
    form.getValues("lastName"),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const fallbackName = displayName || form.getValues("email") || "User";
  const initials = fallbackName
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
      formData.append("userId", form.getValues("id"));
      formData.append("image", file);

      const res = await fetch("/api/admin/users/upload-image", {
        method: "POST",
        body: formData,
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || "Failed to upload image.");
      }

      form.setValue("image", body.url, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      toast({ description: "Image uploaded. Click Save changes to apply." });
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
      title="Personal Details"
      description="Update the core profile and residence details used across the admin area."
    >
      <FormField
        control={form.control}
        name="image"
        render={() => (
          <FormItem className="w-full md:col-span-2">
            <FormLabel>Profile image</FormLabel>
            <FormControl>
              <div className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-2xl border bg-muted">
                    {imageUrl && !imageFailed ? (
                      <img
                        src={imageUrl}
                        alt={fallbackName}
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
                      // Allow selecting the same file again later.
                      event.target.value = "";
                      await uploadImage(file);
                    }}
                    className="sm:max-w-[260px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading || !imageUrl}
                    onClick={() =>
                      form.setValue("image", "", {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <TextField
        form={form}
        name="firstName"
        label="First name"
        placeholder="Enter first name"
      />
      <TextField
        form={form}
        name="lastName"
        label="Last name"
        placeholder="Enter last name"
      />
      <TextField
        form={form}
        name="email"
        label="Email"
        type="email"
        placeholder="name@company.com"
      />

      <FormField
        control={form.control}
        name="role"
        render={({
          field,
        }: {
          field: ControllerRenderProps<UpdateUserFormValues, "role">;
        }) => (
          <FormItem className="w-full">
            <FormLabel>Role</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(value as UserRole)}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatUserRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="country"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Country of residence</FormLabel>
            <Select
              onValueChange={(value) =>
                field.onChange(value === "NONE" ? null : (value as Country))
              }
              value={field.value ?? "NONE"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                {countryOptions.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <TextField
        form={form}
        name="postCode"
        label="Post code"
        placeholder="Enter post code"
      />

      <TextAreaField
        form={form}
        name="address"
        label="Address"
        rows={4}
        placeholder="Enter residential address"
        className="md:col-span-2"
      />
    </Section>
  );
}
