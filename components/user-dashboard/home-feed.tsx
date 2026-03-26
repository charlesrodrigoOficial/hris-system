import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function HomeFeed() {
  return (
      <div className="space-y-6">
      {/* Post box */}
      <Card className="rounded-lg">
        <CardContent className="p-4 space-y-3">
          <div className="h-10 w-full rounded-lg bg-muted flex items-center px-3 text-sm text-muted-foreground">
            Post a Shoutout
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl">Give Kudos</Button>
            <Button variant="outline" className="rounded-xl">Create a poll</Button>
          </div>
        </CardContent>
      </Card>

      {/* Example HR announcement */}
      <Card className="rounded-lg">
        <CardContent className="p-4 space-y-2">
          <div className="text-sm font-semibold">HR/Admin Name who post</div>
          <div className="text-xs text-muted-foreground">6 Feb 2026, 12:49</div>

          <p className="text-sm leading-relaxed">
            Hi team 👋 <br />
            Friendly reminder to please ensure all expenses are uploaded to the designated platform...
          </p>

          <div className="flex gap-3 pt-2 text-sm text-muted-foreground">
            <button className="hover:underline">React</button>
            <button className="hover:underline">Comment</button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
