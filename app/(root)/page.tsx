import { ShoutoutComposer } from "@/components/shared/body/shoutout-composer";
import MainNav from "../user/main-nav";
import NameCard from "../user/profile/name-card";
import Profile from "../user/profile/page";
import { QuickActions } from "../user/profile/quick-actions";
import { AttendanceCard } from "@/components/shared/attendance-card";
import { FeedPostCard } from "@/components/shared/body/feed-post-card";

const Homepage = async () => {
  const posts = [
    {
      id: "1",
      authorName: "HR / Admin Name who post",
      authorRole: "",
      createdAtLabel: "6 Feb 2026, 12:49",
      body: "Hi team 👋 Friendly reminder to please ensure all expenses are uploaded to the designated EoR platform...",
    },
  ];
  return (
    <div className="space-y-6">
      <NameCard />
      <div className="-mt-5">
        <QuickActions />
      </div>
      {/* push attendance down */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          <ShoutoutComposer />

          {posts.map((p) => (
            <FeedPostCard key={p.id} post={p} />
          ))}
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4">
          <AttendanceCard />
        </div>
      </div>

      <Profile />
    </div>
  );
};

export default Homepage;
