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
      className={`text-sm ${state.success ? "text-green-600" : "text-destructive"}`}
    >
      {state.message}
    </div>
  );
}

export default function ShoutoutComposer() {
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
    <div className="space-y-3 rounded-xl border bg-white p-4">
      {/* Shoutout */}
      <form action={action} className="flex items-center gap-3">
        <input type="hidden" name="type" value="SHOUTOUT" />
        <Input name="content" placeholder="Post a Shoutout" />
        <Button type="submit">Post</Button>
      </form>
      <Msg state={state} />

      {/* Actions row */}
      <div className="flex items-center justify-between border-t pt-3">
        {/* Kudos */}
        <Dialog open={kudosOpen} onOpenChange={setKudosOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="gap-2">
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
              <Input name="content" placeholder="Write kudos message..." />
              <Button type="submit" className="w-full">
                Send Kudos
              </Button>
              <Msg state={kudosState} />
            </form>
          </DialogContent>
        </Dialog>

        {/* Poll */}
        <Dialog open={pollOpen} onOpenChange={setPollOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="gap-2">
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
              />
              <Input name="pollQuestion" placeholder="Poll question" />

              <div className="space-y-2">
                {options.map((v, idx) => (
                  <Input
                    key={idx}
                    placeholder={`Option ${idx + 1}`}
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
                  onClick={() => setOptions((p) => [...p, ""])}
                >
                  + Add option
                </Button>
              </div>

              <Button type="submit" className="w-full">
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
