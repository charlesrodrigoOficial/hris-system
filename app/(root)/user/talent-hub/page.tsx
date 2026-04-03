import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
} from "@/components/ui/card";
import {
  ClipboardList,
  MessageSquareText,
  Target,
  Trophy,
} from "lucide-react";

const HERO_IMAGE_SRC = "/images/talent-hub.png";



const tiles = [
  {
    title: "Surveys",
    href: "/user/talent-hub/surveys",
    Icon: ClipboardList,
  },
  {
    title: "Performance",
    href: "/user/talent-hub/performance",
    Icon: Trophy,
  },
  {
    title: "Goals",
    href: "/user/talent-hub/goals",
    Icon: Target,
  },
  {
    title: "1-on-1s",
    href: "/user/talent-hub/one-on-ones",
    Icon: MessageSquareText,
  },
] as const;

export default async function TalentHubPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Card className="min-h-[520px] overflow-hidden rounded-3xl border-slate-200 bg-[#F3F5F4] shadow-sm">
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[360px_1fr] lg:gap-10">
          <div className="relative min-h-[240px] overflow-hidden rounded-3xl sm:min-h-[320px] lg:min-h-[440px]">
            <Image
              src={HERO_IMAGE_SRC}
              alt="Talent hub"
              fill
              priority
              sizes="(min-width: 1024px) 360px, 100vw"
              className="object-contain p-6"
            />
          </div>

          <div className="flex flex-col justify-center">
            <div className="h-7 w-28 bg-blue-900" />
            <h1 className="mt-3 text-4xl font-serif font-semibold tracking-tight text-slate-700 sm:text-5xl">
              Talent hub
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-600 sm:text-base">
              Grow within your company and maximize your potential with Intelura
              Talent.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-6">
              {tiles.map(({ title, href, Icon }) => (
                <Link
                  key={title}
                  href={href}
                  className="group flex flex-col items-center gap-2"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    {title}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
