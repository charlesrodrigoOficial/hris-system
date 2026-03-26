"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "./logo";

export default function NameCardClient({
  name,
  role,
  image,
}: {
  name: string;
  role: string;
  image: string | null;
}) {
  const cardRef = React.useRef<HTMLDivElement>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left; // mouse x in card
    const y = e.clientY - rect.top; // mouse y in card

    // normalize to -0.5 .. 0.5
    const px = x / rect.width - 0.5;
    const py = y / rect.height - 0.5;

    // tilt strength
    const max = 12; // degrees
    const rotY = px * max; // left/right
    const rotX = -py * max; // up/down (invert)
    const scale = 1.02;

    // nice highlight that follows cursor
    const hx = (x / rect.width) * 100;
    const hy = (y / rect.height) * 100;

    el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;
    el.style.setProperty("--hx", `${hx}%`);
    el.style.setProperty("--hy", `${hy}%`);
  }

  function handleLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform =
      "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    el.style.setProperty("--hx", `50%`);
    el.style.setProperty("--hy", `50%`);
  }

  return (
    <div className="relative flex flex-col w-full">
      <div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="tilt-card relative flex-1 overflow-hidden rounded-lg p-10 text-white"
      >
        <div className="relative z-10 pr-[290px]">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 border border-sky-200/50 shadow-sm">
              <AvatarImage src={image ?? undefined} alt={name} />
              <AvatarFallback className="bg-sky-500/25 text-xs text-white">
                {name?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
            <p className="text-lg uppercase tracking-wide opacity-90">
              HI {name}
            </p>
          </div>

          <h1 className="mt-3 text-4xl md:text-4xl font-bold leading-tight">
            Glad you&apos;re here
          </h1>

          <p className="mt-5 text-sm opacity-90">
            Role: <span className="font-medium">{role}</span>
          </p>
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
