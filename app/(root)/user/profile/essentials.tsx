"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, Sparkles } from "lucide-react";

type EssentialsCardProps = {
  className?: string;
};

export function EssentialsCard({ className }: EssentialsCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-lg border border-sky-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.96),_rgba(224,242,254,0.94)_28%,_rgba(191,219,254,0.9)_62%,_rgba(147,197,253,0.92)_100%)] p-4 text-slate-900 shadow-[0_18px_44px_-30px_rgba(29,78,216,0.32)] transition hover:-translate-y-1 hover:shadow-[0_22px_56px_-34px_rgba(29,78,216,0.35)]",
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/70 bg-sky-100/60 text-sky-700 shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold bg-gradient-to-r from-sky-700 via-blue-700 to-cyan-600 bg-clip-text text-transparent">
            Essentials
          </p>
          <p className="text-xs text-slate-600">Important shortcuts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          asChild
          variant="outline"
          className="
            group h-11 flex-col items-center justify-center gap-1
            rounded-xl border border-sky-200 bg-white/75
            text-xs font-medium text-slate-800
            transition
            hover:-translate-y-1 hover:border-sky-300
            hover:bg-white hover:shadow
          "
        >
          <Link
            href="https://sites.google.com/intelura.com/intelurapedia/home?pli=1&authuser=2"
            target="_blank"
            rel="noreferrer"
          >
            <BookOpen className="h-4 w-4 text-slate-500 group-hover:text-sky-700" />
            Inteluropedia
          </Link>
        </Button>
      </div>
    </Card>
  );
}
