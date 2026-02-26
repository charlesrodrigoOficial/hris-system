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
import { ShoutoutComposer } from "@/components/shared/body/shoutout-composer";
import { FeedPostCard } from "@/components/shared/body/feed-post-card";
import { BirthdaysCarousel } from "@/components/shared/body/birthdays-carousel";

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

  

  const birthdays = [
    { id: "b1", name: "John", subtitle: "Today" },
    { id: "b2", name: "Maria", subtitle: "Tomorrow" },
    { id: "b3", name: "Sam", subtitle: "6 Feb" },
  ];

  return (
    <SessionProvider session={session}>
      <div className="space-y-6 ">
        {/* Rest of dashboard */}
        <div className="grid grid-cols- gap-6 lg:grid-cols-12">
          

          {/* ✅ Intelurapedia (right - ABOVE salary) */}
          {/* <div className="lg:col-span-3 rounded-xl bg-blue-600  p-6 text-white shadow">
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
          </div> */}
          {/* <SalaryAndPaydayCard /> */}
        </div>
      </div>
    </SessionProvider>
  );
};

export default Profile;
