"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type BirthdayUser = {
  id: string;
  name: string;
  subtitle?: string; // e.g. "Today", "Tomorrow", "6 Feb"
};

export function BirthdaysCarousel({ users }: { users: BirthdayUser[] }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="p-4 font-medium">Birthdays</CardHeader>

      <CardContent className="pb-4">
        <div className="flex gap-4 overflow-x-auto pr-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="min-w-[220px] rounded-xl border bg-muted/30 p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{u.name?.[0] ?? "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {u.subtitle ?? "Happy Birthday!"}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-background/60 p-3 text-center text-sm">
                🎉 Happy Birthday!
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
