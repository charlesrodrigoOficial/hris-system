"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { sendBirthdayWish } from "@/lib/actions/birthday-wishes.actions";

type BirthdayWish = {
  userId: string;
  name?: string | null;
  image?: string | null;
};

export type BirthdayUser = {
  id: string;
  name: string;
  image?: string | null;
  position?: string | null;
  wishDate: string;
  wishes?: BirthdayWish[];
  subtitle?: string; // e.g. "Today", "Tomorrow", "6 Feb"
};

type Props = {
  users?: BirthdayUser[];
  title?: string;
  currentUserId?: string;
};

export function BirthdaysCarousel({
  users = [],
  title = "Birthdays",
  currentUserId,
}: Props) {
  const router = useRouter();
  const [pendingUserId, setPendingUserId] = React.useState<string | null>(null);
  const [optimisticWishes, setOptimisticWishes] = React.useState<
    Record<string, BirthdayWish[]>
  >({});
  const [errorByUserId, setErrorByUserId] = React.useState<
    Record<string, string>
  >({});
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [, startTransition] = React.useTransition();

  function getWishes(user: BirthdayUser) {
    return optimisticWishes[user.id] ?? user.wishes ?? [];
  }

  function hasWishedByCurrentUser(user: BirthdayUser) {
    return Boolean(
      currentUserId &&
        getWishes(user).some((wish) => wish.userId === currentUserId),
    );
  }

  function buildSeed(value: string) {
    let hash = 0;

    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 33 + value.charCodeAt(i)) | 0;
    }

    return Math.abs(hash);
  }

  function getAccentBandClass(seed: string) {
    const palette = [
      "bg-[#6b1f3a]",
      "bg-[#c79a7f]",
      "bg-[#0b3a4a]",
      "bg-[#5b3a82]",
      "bg-[#1f5a8a]",
      "bg-[#1f6b4a]",
    ];
    const index = buildSeed(seed) % palette.length;
    return palette[index] ?? palette[0];
  }

  function updateScrollButtons() {
    const el = scrollerRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const current = el.scrollLeft;
    const threshold = 4;

    setCanScrollLeft(current > threshold);
    setCanScrollRight(current < maxScrollLeft - threshold);
  }

  function handleWish(userId: string, wishDate: string) {
    setErrorByUserId((current) => ({ ...current, [userId]: "" }));
    setPendingUserId(userId);

    startTransition(async () => {
      const result = await sendBirthdayWish(userId, wishDate);

      if (result.success && "wish" in result) {
        setOptimisticWishes((current) => {
          const existing =
            current[userId] ?? users.find((user) => user.id === userId)?.wishes ?? [];
          const nextWish = result.wish;

          if (!nextWish || existing.some((wish) => wish.userId === nextWish.userId)) {
            return current;
          }

          return {
            ...current,
            [userId]: [...existing, nextWish],
          };
        });

        router.refresh();
      } else {
        setErrorByUserId((current) => ({
          ...current,
          [userId]:
            ("message" in result ? result.message : null) ??
            "Could not save wish",
        }));
      }

      setPendingUserId((current) => (current === userId ? null : current));
    });
  }

  React.useEffect(() => {
    updateScrollButtons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users.length]);

  function scrollByCards(direction: "left" | "right") {
    const el = scrollerRef.current;
    if (!el) return;

    const amount = Math.max(280, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <Card className="rounded-lg border border-slate-200 bg-white/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
      </CardHeader>

      <CardContent className="relative pb-4">
        <div className="relative">
          <div
            ref={scrollerRef}
            className="scrollbar-hidden flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
            onScroll={updateScrollButtons}
          >
            {users.length === 0 ? (
              <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-xs text-slate-500 shadow-sm">
                No birthdays coming up.
              </div>
            ) : (
              users.map((u) => {
                const wishes = getWishes(u);
                const isPending = pendingUserId === u.id;
                const isWishedByMe = hasWishedByCurrentUser(u);

                return (
                  <div
                    key={u.id}
                    className="snap-start"
                    aria-label={`Birthday card for ${u.name}`}
                  >
                    <div className="relative w-[240px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                      <div
                        className={`h-10 ${getAccentBandClass(`${u.id}:${u.wishDate}`)}`}
                      />

                      <div className="relative -mt-8 flex justify-center px-4">
                        <Avatar className="h-16 w-16 border-4 border-white shadow-sm">
                          <AvatarImage src={u.image ?? undefined} alt={u.name} />
                          <AvatarFallback className="bg-slate-100 text-base text-slate-700">
                            {u.name?.[0] ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="px-4 pb-4 pt-3 text-center">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {u.name}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {u.position?.trim() ? u.position : "Employee"}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="mt-3 h-8 w-full rounded-md border-slate-300 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-70"
                          onClick={() => handleWish(u.id, u.wishDate)}
                          disabled={isPending || isWishedByMe}
                        >
                          {isPending
                            ? "Sending..."
                            : isWishedByMe
                              ? "Wished"
                              : wishes.length > 0
                                ? "Send wishes"
                                : "Send wishes"}
                        </Button>

                        <div className="mt-2 text-xs text-slate-500">
                          {u.subtitle ?? ""}
                        </div>

                        {errorByUserId[u.id] ? (
                          <div className="mt-2 text-[11px] text-red-600">
                            {errorByUserId[u.id]}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            aria-label="Scroll birthdays left"
            onClick={() => scrollByCards("left")}
            disabled={!canScrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/90 p-2 text-slate-700 shadow-sm backdrop-blur disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Scroll birthdays right"
            onClick={() => scrollByCards("right")}
            disabled={!canScrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/90 p-2 text-slate-700 shadow-sm backdrop-blur disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// Allows: import BirthdaysCarousel from "...";
// Also allows: import { BirthdaysCarousel } from "...";
export default BirthdaysCarousel;
