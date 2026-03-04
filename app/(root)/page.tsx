import ShoutoutComposer from "@/components/shared/body/feed/shoutout-composer";
import MainNav from "./user/main-nav";
import NameCard from "./user/profile/name-card";
import Profile from "./user/profile/page";
import { QuickActions } from "./user/profile/quick-actions";
import { AttendanceCard } from "@/components/shared/attendance-card";
import { FeedPostCard } from "@/components/shared/body/feed-post-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import BirthdaysCarousel from "@/components/shared/body/birthdays-carousel";
import { getFeedPosts } from "@/lib/feed/getFeedPoosts";
import { auth } from "@/auth";

const Homepage = async () => {
  const birthdayUsers = [
    { id: "1", name: "Salah", subtitle: "Today" },
    { id: "2", name: "Ludo", subtitle: "Tomorrow" },
    { id: "3", name: "Shena", subtitle: "6 Feb" },
  ];
  const session = await auth();
  const posts = await getFeedPosts(session?.user?.id);
  return (
    <div className="space-y-6">
      <NameCard />

      {/* push attendance down */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-1">
          <ShoutoutComposer />

          <ScrollArea className="h-[200px] pr-3">
            <div className="space-y-6">
              {posts.map((p) => (
                <FeedPostCard key={p.id} post={p} />
              ))}
            </div>
          </ScrollArea>

          <BirthdaysCarousel users={birthdayUsers} />
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          <AttendanceCard />
          <QuickActions />
        </div>
      </div>

      <Profile />
    </div>
  );
};

export default Homepage;
