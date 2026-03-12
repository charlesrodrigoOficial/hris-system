"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export type BirthdayUser = {
  id: string;
  name: string;
  subtitle?: string; // e.g. "Today", "Tomorrow", "6 Feb"
};

type Props = {
  users?: BirthdayUser[];
  title?: string;
};

export function BirthdaysCarousel({ users = [], title = "Birthdays" }: Props) {
  return (
    <Card className="rounded-2xl border border-sky-200/70 bg-gradient-to-b from-blue-300 via-sky-100 to-slate-200 shadow-lg">
      <CardHeader className="p-4 font-medium text-slate-700">{title}</CardHeader>

      <CardContent className="pb-4">
        <div className="flex gap-4 overflow-x-auto pr-2">
          {users.length === 0 ? (
            <div className="px-1 text-xs text-slate-500">
              No birthdays coming up.
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="dashboard-gradient-soft min-w-[220px] rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-sky-100 text-slate-700">
                      {u.name?.[0] ?? "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-slate-500">
                      {u.subtitle ?? "Happy Birthday!"}
                    </div>
                  </div>
                </div>

                <div className="dashboard-gradient-muted mt-3 rounded-lg p-3 text-center text-xs text-slate-700">
                  🎉 Happy Birthday!
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ✅ allows: import BirthdaysCarousel from "...";
// ✅ also allows: import { BirthdaysCarousel } from "...";
export default BirthdaysCarousel;
