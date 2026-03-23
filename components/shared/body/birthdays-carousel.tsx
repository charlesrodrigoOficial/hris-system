"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CakeSlice, Gift, Sparkles } from "lucide-react";
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
  const [, startTransition] = React.useTransition();

  function getFirstName(name: string) {
    return name.trim().split(/\s+/)[0] || "Employee";
  }

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

  function getWishStyle(seed: string, index: number) {
    const hash = buildSeed(`${seed}:${index}`);
    const topSlots = [16, 44, 72];
    const leftSlots = [20, 50, 78];
    const lane = index % topSlots.length;
    const column =
      (Math.floor(index / topSlots.length) + Math.floor(hash / 13)) %
      leftSlots.length;
    const top = topSlots[lane] + ((hash % 8) - 4);
    const left = leftSlots[column] + ((Math.floor(hash / 7) % 10) - 5);
    const rotate = (Math.floor(hash / 17) % 30) - 15;

    return {
      top: `${top}%`,
      left: `${left}%`,
      transform: `translate(-${left / 3}%, -${top / 5}%) rotate(${rotate}deg)`,
      zIndex: index + 1,
    } as const;
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

  return (
    <Card className="relative overflow-hidden rounded-[2rem] border border-rose-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(255,232,238,0.94)_28%,_rgba(255,209,220,0.92)_62%,_rgba(255,189,204,0.95)_100%)] shadow-[0_24px_60px_-34px_rgba(190,24,93,0.45)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-8 top-5 h-24 w-24 rounded-full bg-white/45 blur-2xl" />
        <div className="absolute right-10 top-7 h-16 w-16 rounded-full bg-amber-200/45 blur-xl" />
        <div className="absolute bottom-4 left-1/3 h-20 w-20 rounded-full bg-rose-300/30 blur-2xl" />
        <div className="absolute left-6 top-6 h-2.5 w-2.5 rounded-full bg-rose-400/60" />
        <div className="absolute left-16 top-14 h-1.5 w-1.5 rounded-full bg-amber-400/70" />
        <div className="absolute right-16 top-12 h-2 w-2 rounded-full bg-fuchsia-400/60" />
        <div className="absolute right-24 top-20 h-1.5 w-1.5 rounded-full bg-rose-500/70" />
        <div className="absolute bottom-10 right-10 h-2 w-2 rounded-full bg-amber-300/70" />
      </div>

      <CardHeader className="relative flex flex-row items-center justify-between gap-3 p-5">
        <div>
          <div className="flex items-center gap-2 text-rose-600">
            <Sparkles className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">
              Celebrate
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Birthday wishes stay bright and visible all month.
          </div>
        </div>

        <div className="hidden rounded-full border border-white/70 bg-white/55 p-3 text-rose-600 shadow-sm sm:flex">
          <CakeSlice className="h-5 w-5" />
        </div>
      </CardHeader>

      <CardContent className="relative pb-5">
        <div className="flex gap-4 overflow-x-auto pr-2">
          {users.length === 0 ? (
            <div className="rounded-2xl border border-white/70 bg-white/60 px-4 py-6 text-xs text-slate-500 shadow-sm">
              No birthdays coming up.
            </div>
          ) : (
            users.map((u) => {
              const wishes = getWishes(u);

              return (
                <div
                  key={u.id}
                  className="relative min-w-[255px] overflow-hidden rounded-[1.6rem] border border-white/80 bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(255,247,250,0.92))] p-4 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.4)]"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#fb7185,#f59e0b,#f472b6)]" />
                  <div className="absolute right-3 top-3 rounded-full border border-rose-100 bg-rose-50/90 p-2 text-rose-500 shadow-sm">
                    <Gift className="h-3.5 w-3.5" />
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Avatar className="h-12 w-12 ring-4 ring-rose-100/90">
                      <AvatarImage src={u.image ?? undefined} alt={u.name} />
                      <AvatarFallback className="bg-rose-100 text-sm text-rose-700">
                        {u.name?.[0] ?? "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 pt-1">
                      <div className="truncate text-lg font-semibold text-slate-900">
                        {u.name}
                      </div>
                      <div className="mt-0.5 text-xs font-medium text-rose-500">
                        {u.subtitle ?? "Happy Birthday!"}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 h-9 w-full rounded-full border-rose-200/90 bg-white/90 px-3 text-[11px] font-semibold text-rose-700 shadow-sm hover:bg-rose-50 disabled:border-emerald-200 disabled:bg-emerald-50/90 disabled:text-emerald-700"
                    onClick={() => handleWish(u.id, u.wishDate)}
                    disabled={pendingUserId === u.id || hasWishedByCurrentUser(u)}
                  >
                    {pendingUserId === u.id
                      ? "Sending..."
                      : hasWishedByCurrentUser(u)
                        ? "Wished By You"
                        : wishes.length > 0
                          ? "Add Your Wish"
                          : "Happy Birthday"}
                  </Button>

                  <div className="relative mt-4 h-36 overflow-hidden rounded-[1.3rem] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.82),rgba(255,241,245,0.45)_60%,rgba(255,255,255,0)_100%)]">
                    {wishes.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                        Wishes will appear here
                      </div>
                    ) : (
                      wishes.map((wish, index) => (
                        <div
                          key={`${wish.userId}-${index}`}
                          className="absolute flex max-w-[126px] items-center gap-1.5 rounded-full border border-rose-200/90 bg-white/95 px-2.5 py-1.5 shadow-[0_10px_24px_-18px_rgba(225,29,72,0.8)]"
                          style={getWishStyle(
                            `${u.id}:${u.wishDate}:${wish.userId}`,
                            index,
                          )}
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={wish.image ?? undefined}
                              alt={wish.name ?? "Wisher"}
                            />
                            <AvatarFallback className="bg-rose-50 text-[9px] text-rose-700">
                              {wish.name?.[0] ?? "U"}
                            </AvatarFallback>
                          </Avatar>

                          <span className="truncate text-[10px] font-semibold text-rose-700">
                            HB {getFirstName(u.name)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {errorByUserId[u.id] ? (
                    <div className="mt-1 text-[10px] text-red-600">
                      {errorByUserId[u.id]}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Allows: import BirthdaysCarousel from "...";
// Also allows: import { BirthdaysCarousel } from "...";
export default BirthdaysCarousel;
