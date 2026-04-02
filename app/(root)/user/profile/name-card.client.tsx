"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "./logo";

function toTitleCase(input: string) {
  const cleaned = input.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  return cleaned
    .split(" ")
    .map((word) => {
      const w = word.trim();
      if (!w) return "";
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export default function NameCardClient({
  name,
  role,
  image,
}: {
  name: string;
  role: string;
  image: string | null;
}) {
  const displayName = toTitleCase(name);

  return (
    <div className="relative flex flex-col w-full">
      <div
        className="tilt-card relative flex-1 overflow-hidden rounded-lg p-6 text-white sm:p-8 md:p-10"
      >
        <div className="relative z-10 pr-0 md:pr-[290px]">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-sky-200/50 shadow-sm">
              <AvatarImage src={image ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-sky-500/25 text-xs text-white">
                {displayName?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
            <p className="text-lg font-medium tracking-wide opacity-90">
              Hi {displayName}
            </p>
          </div>

          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-4xl">
            Glad you&apos;re here
          </h1>
        </div>

        <div className="lava-container">
          <div className="lava" />
          <div className="lava-blur" />
          <div className="lava-ripple" />
          <div className="shooting-star" />
          <div className="asteroid-field" />
          <div className="asteroid-fragment fragment-1" />
          <div className="asteroid-fragment fragment-2" />
        </div>

        <div className="tilt-highlight pointer-events-none absolute inset-0" />
        <div className="tilt-rim pointer-events-none absolute inset-0 rounded-lg" />
        <div className="tilt-bevel pointer-events-none absolute inset-0 rounded-lg" />
      </div>

      {/* ✅ LOGO OVERLAY anchored to this wrapper */}
      <Logo />
    </div>
  );
}
