"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createBirthdayWishPost } from "@/lib/actions/birthday-wishes.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [, startTransition] = React.useTransition();
  const [wishDialogOpen, setWishDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<BirthdayUser | null>(
    null,
  );

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

  function openWishDialog(user: BirthdayUser) {
    setSelectedUser(user);
    setWishDialogOpen(true);
  }

  function closeWishDialog() {
    setWishDialogOpen(false);
    setSelectedUser(null);
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

  function applyOptimisticWish(userId: string, wish: BirthdayWish | undefined) {
    if (!wish) return;

    setOptimisticWishes((current) => {
      const existing =
        current[userId] ?? users.find((user) => user.id === userId)?.wishes ?? [];

      if (existing.some((item) => item.userId === wish.userId)) {
        return current;
      }

      return {
        ...current,
        [userId]: [...existing, wish],
      };
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
                          onClick={() => openWishDialog(u)}
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

      {selectedUser ? (
        <BirthdayWishDialog
          key={`${selectedUser.id}:${selectedUser.wishDate}`}
          open={wishDialogOpen}
          onOpenChange={(open) => {
            if (!open) closeWishDialog();
            else setWishDialogOpen(true);
          }}
          user={selectedUser}
          onSubmitting={(userId) => setPendingUserId(userId)}
          onSubmitted={() => setPendingUserId(null)}
          onSuccess={(wish) => {
            applyOptimisticWish(selectedUser.id, wish);
            startTransition(() => router.refresh());
            closeWishDialog();
          }}
        />
      ) : null}
    </Card>
  );
}

function BirthdayWishDialog({
  open,
  onOpenChange,
  user,
  onSubmitting,
  onSubmitted,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: BirthdayUser;
  onSubmitting: (userId: string) => void;
  onSubmitted: () => void;
  onSuccess: (wish: BirthdayWish | undefined) => void;
}) {
  const [state, action] = useActionState(createBirthdayWishPost, {
    success: false,
    message: "",
  } as any);
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send birthday wishes</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white/70 px-3 py-2">
          <Avatar className="h-10 w-10 border border-slate-200">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-slate-100 text-sm text-slate-700">
              {user.name?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">
              {user.name}
            </div>
            <div className="text-xs text-slate-500">{user.subtitle ?? ""}</div>
          </div>
        </div>

        <form
          ref={formRef}
          action={async (fd) => {
            onSubmitting(user.id);
            const res = (await action(fd)) as any;
            onSubmitted();

            if (res?.success) {
              formRef.current?.reset();
              onSuccess(res?.wish);
            }
            return res;
          }}
          className="space-y-3"
        >
          <input type="hidden" name="birthdayUserId" value={user.id} />
          <input type="hidden" name="wishDate" value={user.wishDate} />

          <Textarea
            name="content"
            placeholder="Write your wish (optional)…"
            className="min-h-[90px] text-xs"
          />

          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-700">
              Add an image (optional)
            </div>
            <Input name="image" type="file" accept="image/*" className="text-xs" />
            <div className="text-[11px] text-slate-500">
              If you don&apos;t upload an image, a birthday design card will be used.
            </div>
          </div>

          <Button type="submit" className="w-full text-xs">
            Post wish
          </Button>

          {state?.message ? (
            <div
              className={`text-xs ${
                state?.success ? "text-green-700" : "text-red-600"
              }`}
            >
              {state.message}
            </div>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Allows: import BirthdaysCarousel from "...";
// Also allows: import { BirthdaysCarousel } from "...";
export default BirthdaysCarousel;
