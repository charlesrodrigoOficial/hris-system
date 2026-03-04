"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpDefaultValues } from "@/lib/constants";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createUser } from "@/lib/actions/user.actions";

/* submit button component */
const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} className="w-full" variant="default">
      {pending ? "Creating..." : "Create User"}
    </Button>
  );
};

const CreateUserForm = () => {
  const [data, action] = useActionState(createUser, {
    success: false,
    message: "",
  });

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-3">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            defaultValue={signUpDefaultValues.name}
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={signUpDefaultValues.email}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            defaultValue={signUpDefaultValues.password}
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            defaultValue={signUpDefaultValues.confirmPassword}
          />
        </div>

        <SubmitButton />

        {!!data?.message && (
          <div
            className={`text-center text-sm ${
              data.success ? "text-green-600" : "text-destructive"
            }`}
          >
            {data.message}
          </div>
        )}
      </div>
    </form>
  );
};

export default CreateUserForm;