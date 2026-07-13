import { MessageSquare } from "lucide-react";
import { ForumThreadCard } from "../ui";
import type { ForumThreadMapped } from "../../utils/api";

interface ProfilePostsTabProps {
  userPosts: ForumThreadMapped[];
}

export function ProfilePostsTab({ userPosts }: ProfilePostsTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" /> Forum Threads Created
      </h2>
      <div className="space-y-3">
        {userPosts.map((thread) => (
          <ForumThreadCard key={thread.id} thread={thread} />
        ))}
        {userPosts.length === 0 && (
          <div className="glass rounded-xl p-6 text-center text-text-muted text-xs">
            No forum threads created by this member.
          </div>
        )}
      </div>
    </div>
  );
}
