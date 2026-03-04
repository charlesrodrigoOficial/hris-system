// app/user/profile/your-salary.tsx

export function SalaryAndPaydayCard() {
  return (
    <div className="lg:col-span-3 min-w-0 rounded-xl bg-blue-600 p-6 text-white shadow">
      <h2 className="text-2xl font-semibold leading-tight break-words">
        Salary & Pay Day
      </h2>
      <p className="mt-2 text-sm text-white/80">All payroll info in one place</p>

      <div className="mt-6 space-y-4">
        {/* Salary */}
        <div className="rounded-xl bg-white/10 p-4">
          <p className="text-sm text-white/80">Your Salary</p>
          <p className="mt-1 text-3xl font-semibold">GBP 7,794</p>
          <p className="mt-2 text-xs text-white/70">
            Last Updated: <span className="text-white">2026-02-19</span>
          </p>
        </div>

        {/* Pay Day */}
        <div className="rounded-xl bg-white/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-white/80">Pay Day</span>
            <span className="font-semibold text-sm">1st of every month</span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-sm text-white/80">Days Remaining</span>
            <span className="font-semibold text-sm">10 Days</span>
          </div>

          <div className="mt-4">
            <div className="h-3 w-full rounded-full bg-white/20">
              <div className="h-3 w-[67%] rounded-full bg-white" />
            </div>
            <div className="mt-2 text-xs text-white/80">67%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
