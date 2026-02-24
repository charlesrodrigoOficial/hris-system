import { Metadata } from "next";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import { AttendanceButton } from "@/components/shared/attendance-button";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SalaryAndPaydayCard } from "./your-salary";
import {
  clamp,
  monthName,
  getMonthStats,
  getPaydayInfo,
} from "@/lib/user/date-utils";

export const metadata: Metadata = {
  title: "Profile",
};

function Bar({
  value,
  label,
  rightText,
  colorClass,
}: {
  value: number; // 0..100
  label: string;
  rightText?: string;
  colorClass: string;
}) {
  const v = clamp(value, 0, 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-200">
        <span className="font-medium">{label}</span>
        {rightText ? <span className="text-slate-300">{rightText}</span> : null}
      </div>
      <div className="h-12 w-full rounded-full bg- p-2">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

const Profile = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const isSignedInToday = false;

  const quote = {
    text: "Loading Quote...",
    author: "Loading Author...",
  };

  const salary = {
    currency: "GBP",
    amount: 7794,
    lastUpdated: new Date(),
  };

  // ✅ set your Intelurapedia link here
  const intelurapediaUrl = "https://your-intelurapedia-link.com";
  const now = new Date();
  const monthStats = getMonthStats(now);
  const payday = getPaydayInfo(now, 1);

  const attendanceThisMonth = {
    attended: 5,
    absent: 2,
    expectedWorkDays: monthStats.workDays,
    hoursDelta: -16,
    lateHours: 15.95,
  };

  const attendedPct =
    attendanceThisMonth.expectedWorkDays > 0
      ? (attendanceThisMonth.attended / attendanceThisMonth.expectedWorkDays) *
        100
      : 0;

  const absentPct =
    attendanceThisMonth.expectedWorkDays > 0
      ? (attendanceThisMonth.absent / attendanceThisMonth.expectedWorkDays) *
        100
      : 0;

  const latePct = clamp(attendanceThisMonth.lateHours * 6, 0, 100);

  return (
    <SessionProvider session={session}>
      <div className="space-y-6">
        {/* ✅ KEEP THIS CARD SAME (your current progress) */}
        <div className="flex items-center justify-between rounded bg-blue-600 p-6 text-white ">
          <div>
            <h1 className="text-2xl font-serif">
              Welcome, {session?.user.name}!
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Role: <span className="font-normal">{session?.user.role}</span>
            </p>
          </div>
        </div>

        {/* Rest of dashboard */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Quote of the day (wide) */}
          <div className="lg:col-span-6 rounded-xl bg-blue-600 p-6 text-white shadow-md">
            <h2 className="text-2xl- font-serif">Quote of the day</h2>
            <div className="mt-5 space-y-2">
              <p className="text-2xl italic text-slate-100">“{quote.text}”</p>
              <p className="text-sm italic text-slate-400">- {quote.author}</p>
            </div>
          </div>

          {/* ✅ Intelurapedia (right - ABOVE salary) */}
          <div className="lg:col-span-3 rounded-xl bg-blue-600  p-6 text-white shadow">
            <h2 className="text-2xl font-serif">Intelurapedia</h2>
            <p className="mt-4 text-sm text-slate-300">
              Company knowledge base, policies, internal guides and resources.
            </p>

            <div className="mt-6">
              <Link href={intelurapediaUrl} target="_blank" rel="noreferrer">
                <button className="w-full rounded-lg bg-white px-4 py-3 font-semibold text-black transition hover:bg-blue-900 hover:text-white">
                  Visit Intelurapedia
                </button>
              </Link>
            </div>
          </div>
          <SalaryAndPaydayCard />
          {/* Month data (middle) */}
          <div className="lg:col-span-3 rounded-xl bg-blue-600  p-6 text-white shadow">
            <h2 className="text-2xl font-semibold">Data of {monthName(now)}</h2>

            <div className="mt-6 space-y-3 text-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-serif">Work Days:</span>
                <span className="font-serif">{monthStats.workDays} Days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-serif">Weekends:</span>
                <span className="font-serif">{monthStats.weekends} Days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-serif">Holidays:</span>
                <span className="font-serif">{monthStats.holidays} Days</span>
              </div>
            </div>
          </div>

          {/* Attendance (right wide) */}
          <div className="lg:col-span-5 rounded-xl bg-blue-600  p-6 text-white shadow">
            <h2 className="text-2xl font-semibold">
              Your Attendance This Month
            </h2>

            <div className="mt-6 space-y-5 font-serif">
              <Bar
                label={`Attended ${attendanceThisMonth.attended}`}
                value={attendedPct}
                colorClass="bg-white"
              />

              <Bar
                label={`Absented: ${attendanceThisMonth.absent}`}
                value={absentPct}
                colorClass="bg-white"
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-serif">Hours:</span>
                    <span className="text-slate-300">
                      {attendanceThisMonth.hoursDelta}h
                    </span>
                  </div>
                  <span className="text-slate-300">
                    {attendanceThisMonth.lateHours.toFixed(2)} Hours late
                  </span>
                </div>

                <div className="h-12 w-full rounded-full bg-slate-700/60 p-2">
                  <div
                    className="h-full rounded-full  bg-white"
                    style={{ width: `${latePct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
};

export default Profile;
