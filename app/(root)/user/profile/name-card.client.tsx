"use client";

import * as React from "react";
import Logo from "./logo";

export default function NameCardClient({
  name,
  role,
}: {
  name: string;
  role: string;
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
        className="tilt-card relative overflow-hidden flex-1 rounded-xl p-10 text-white shadow-lg"
      >
        <div className="relative z-10 pr-[290px]">
          <p className="text-lg uppercase tracking-wide opacity-90">HI {name}</p>

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
          <div className="asteroid-hero" />
          <div className="asteroid-fragment fragment-1" />
          <div className="asteroid-fragment fragment-2" />
        </div>

        <div className="tilt-highlight pointer-events-none absolute inset-0" />
        <div className="tilt-rim pointer-events-none absolute inset-0 rounded-2xl" />
        <div className="tilt-bevel pointer-events-none absolute inset-0 rounded-2xl" />
      </div>

      {/* ✅ LOGO OVERLAY anchored to this wrapper */}
      <Logo />
    </div>
  );
}
