import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import CredentialsSignInForm from "./credentials-signin-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { normalizeRelativeCallbackUrl } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Sign In",
};

const SignInPage = async (props: {
  searchParams: Promise<{
    callbackUrl: string;
  }>;
}) => {
  const { callbackUrl } = await props.searchParams;
  const redirectTo = normalizeRelativeCallbackUrl(callbackUrl);

  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  if (session) {
    return redirect(redirectTo);
  }

  return (
    <div className="w-full max-w-6xl">
      <div className="grid items-center gap-12 md:grid-cols-[520px_minmax(0,480px)] md:justify-end">
        <Link href="/" className="flex items-center justify-center self-center md:justify-start">
          <Image
            src="/images/favicon.png"
            width={420}
            height={420}
            alt={`${APP_NAME} logo`}
            priority={true}
            className="h-auto w-full max-w-[420px] object-contain"
          />
        </Link>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-900 shadow-sm">
                <User className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-center"> Sign In </CardTitle>
            <CardDescription className="text-center">
              Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CredentialsSignInForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignInPage;
