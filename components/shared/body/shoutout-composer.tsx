"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, BarChart3 } from "lucide-react";

export function ShoutoutComposer() {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>U</AvatarFallback>
          </Avatar>

          <Input
            placeholder="Post a Shoutout"
            className="h-11 rounded-full bg-muted/50"
          />
        </div>

        <div className="mt-4 flex items-center justify-around border-t pt-3">
          <Button variant="ghost" className="gap-2">
            <Trophy className="h-4 w-4" />
            Give Kudos
          </Button>

          <Button variant="ghost" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Create a poll
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}