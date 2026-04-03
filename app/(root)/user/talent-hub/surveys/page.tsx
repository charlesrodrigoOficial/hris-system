import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TalentHubSurveysPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Card className="rounded-2xl border-slate-200 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>Surveys</CardTitle>
          <CardDescription>Company surveys and feedback.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Coming soon.
        </CardContent>
      </Card>
    </div>
  );
}

