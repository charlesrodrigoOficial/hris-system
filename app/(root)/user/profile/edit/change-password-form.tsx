"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePassword } from "@/lib/actions/user.actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Updating..." : "Update password"}
    </Button>
  );
}

export default function ChangePasswordForm() {
  const [state, action] = useActionState(changePassword, {
    success: false,
    message: "",
  });

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Current password</label>
          <Input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">New password</label>
          <Input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Confirm new password</label>
          <Input
            name="confirmNewPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!!state.message && (
          <p
            className={`text-sm ${state.success ? "text-green-600" : "text-destructive"}`}
          >
            {state.message}
          </p>
        )}
        <SubmitButton />
      </div>
    </form>
  );
}

