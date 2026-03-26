"use client";

import { useActionState, useState } from "react";
import { createFeedPost } from "@/lib/actions/feed.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function Msg({ state }: { state: { success: boolean; message: string } }) {
  if (!state?.message) return null;
  return (
    <div
      className={`text-xs ${state.success ? "text-green-700" : "text-red-600"}`}
    >
      {state.message}
    </div>
  );
}

export default function ShoutoutComposer({
  canCreate,
}: {
  canCreate: boolean;
}) {
  if (!canCreate) return null;

  // SHOUTOUT form
  const [state, action] = useActionState(createFeedPost, {
    success: false,
    message: "",
  });

  // KUDOS dialog
  const [kudosOpen, setKudosOpen] = useState(false);
  const [kudosState, kudosAction] = useActionState(createFeedPost, {
    success: false,
    message: "",
  });

  // POLL dialog
  const [pollOpen, setPollOpen] = useState(false);
  const [pollState, pollAction] = useActionState(createFeedPost, {
    success: false,
    message: "",
  });
  const [options, setOptions] = useState<string[]>(["", ""]);

  return (
    <div className="space-y-3 rounded-lg border border-slate-300/70 bg-gradient-to-b from-slate-300 via-slate-100 to-slate-200 p-4 text-slate-950 shadow-lg">
      {/* Shoutout */}
      <form action={action} className="flex items-center gap-3">
        <input type="hidden" name="type" value="SHOUTOUT" />
        <Input name="content" placeholder="Post a Shoutout" className="text-xs" />
        <Button type="submit" className="text-xs">Post</Button>
      </form>
      <Msg state={state} />

      {/* Actions row */}
      <div className="flex items-center justify-between border-t border-slate-300/70 pt-3">
        {/* Kudos */}
        <Dialog open={kudosOpen} onOpenChange={setKudosOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 text-xs text-slate-900 hover:bg-slate-200 hover:text-black"
            >
              🏆 Give Kudos
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Give Kudos</DialogTitle>
            </DialogHeader>

            <form
              action={async (fd) => {
                const res = await kudosAction(fd);
                // close only on success
                if ((res as any)?.success) setKudosOpen(false);
                return res as any;
              }}
              className="space-y-3"
            >
              <input type="hidden" name="type" value="KUDOS" />
              <Input name="content" placeholder="Write kudos message..." className="text-xs" />
              <Button type="submit" className="w-full text-xs">
                Send Kudos
              </Button>
              <Msg state={kudosState} />
            </form>
          </DialogContent>
        </Dialog>

        {/* Poll */}
        <Dialog open={pollOpen} onOpenChange={setPollOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 text-xs text-slate-900 hover:bg-slate-200 hover:text-black"
            >
              📊 Create a poll
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a poll</DialogTitle>
            </DialogHeader>

            <form
              action={async (fd) => {
                // attach options as multiple pollOptions fields
                options
                  .map((x) => x.trim())
                  .filter(Boolean)
                  .forEach((opt) => fd.append("pollOptions", opt));

                const res = await pollAction(fd);
                if ((res as any)?.success) {
                  setPollOpen(false);
                  setOptions(["", ""]);
                }
                return res as any;
              }}
              className="space-y-3"
            >
              <input type="hidden" name="type" value="POLL" />
              <Input
                name="content"
                placeholder="Optional intro (e.g. Team poll!)"
                className="text-xs"
              />
              <Input name="pollQuestion" placeholder="Poll question" className="text-xs" />

              <div className="space-y-2">
                {options.map((v, idx) => (
                  <Input
                    key={idx}
                    placeholder={`Option ${idx + 1}`}
                    className="text-xs"
                    value={v}
                    onChange={(e) => {
                      const copy = [...options];
                      copy[idx] = e.target.value;
                      setOptions(copy);
                    }}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setOptions((p) => [...p, ""])}
                >
                  + Add option
                </Button>
              </div>

              <Button type="submit" className="w-full text-xs">
                Post Poll
              </Button>
              <Msg state={pollState} />
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
