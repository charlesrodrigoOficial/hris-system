import ShoutoutComposer from "@/components/shared/body/feed/shoutout-composer";
import NameCard from "./user/profile/name-card";
import { AttendanceCard } from "@/components/shared/attendance-card";
import { FeedPostCard } from "@/components/shared/body/feed-post-card";
import BirthdaysCarousel from "@/components/shared/body/birthdays-carousel";
import { getFeedPosts } from "@/lib/feed/getFeedPoosts";
import { auth } from "@/auth";
import { CalendarCard } from "./user/profile/calendar-card";
import { canCreateFeedPost, canManageFeed } from "@/lib/auth/roles";
import { getUpcomingBirthdays } from "@/lib/user/get-upcoming-birthdays";
import { EssentialsCard } from "./user/profile/essentials";


const Homepage = async () => {
  const session = await auth();
  const posts = await getFeedPosts(session?.user?.id);
  const birthdayUsers = await getUpcomingBirthdays(8);
  const canPostToFeed = canCreateFeedPost(session?.user?.role);
  const canModerateFeed = canManageFeed(session?.user?.role);
  const [latestPost, ...olderPosts] = posts;
  return (
    <div className="space-y-6">
      <NameCard />

      {/* push attendance down */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-4">
          <ShoutoutComposer canCreate={canPostToFeed} />

          {latestPost ? (
            <FeedPostCard
              key={latestPost.id}
              post={latestPost}
              canModerate={canModerateFeed}
            />
          ) : null}

          <BirthdaysCarousel
            users={birthdayUsers}
            currentUserId={session?.user?.id}
          />

          <div className="space-y-6">
            {olderPosts.map((p) => (
              <FeedPostCard key={p.id} post={p} canModerate={canModerateFeed} />
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6 self-start lg:sticky lg:top-5">
          <div id="attendance">
            <AttendanceCard />
          </div>
          <CalendarCard className="mt-3" />
          <EssentialsCard />
        </div>
        
      </div>
    </div>
  );
};

export default Homepage;
