import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuickActions } from "@/app/(root)/user/profile/quick-actions"
import { SalaryAndPaydayCard } from "@/app/(root)/user/profile/your-salary"

export function RightPanel() {
  return (
    <div className="space-y-6">
      {/* Profile quick card */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-2">
          <div className="text-sm font-semibold">Employee Name</div>
          <div className="text-xs text-muted-foreground">Go to my profile</div>
          <Button className="w-full rounded-xl">Request time off</Button>
        </CardContent>
      </Card>

      {/* Salary card (optional reuse) */}
      <SalaryAndPaydayCard />

      {/* Quick actions reuse */}
      <QuickActions />
    </div>
  )
}