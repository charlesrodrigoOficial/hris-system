"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo, { InlineLogo } from "./logo";

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
        <div
          className="relative z-10 pr-0 md:pr-[290px]"
          style={{ transform: "none" }}
        >
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border border-[#BFDBFE]/70 shadow-sm sm:h-20 sm:w-20">
              <AvatarImage src={image ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-[#1D4ED8]/30 text-sm text-white">
                {displayName?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 subpixel-antialiased [text-rendering:geometricPrecision]">
              <p className="text-2xl font-extrabold tracking-tight text-white [text-shadow:0_1px_1px_rgba(2,6,23,0.4)] sm:text-3xl md:text-4xl">
                Hi {displayName}
              </p>
              <h1 className="mt-1 text-lg font-normal leading-tight text-[#DBEAFE]/85 [text-shadow:0_1px_0_rgba(2,6,23,0.28)] sm:text-xl md:text-2xl">
                Glad you&apos;re here
              </h1>
            </div>

            <InlineLogo className="ml-2 self-start md:hidden" />
          </div>
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
      <div className="hidden md:block">
        <Logo />
      </div>
    </div>
  );
}
