import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { MessageSquare, Eye, Pin, CheckCircle, BarChart2 } from "lucide-react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { VoteControl } from "../forum/VoteControl";
import { voteThread, type ForumThreadMapped } from "../../utils/api";

const defaultCategories = [
  { id: "general", name: "General Discussion", color: "primary" },
  { id: "tech-talk", name: "Tech Talk", color: "accent" },
  { id: "help", name: "Help & Support", color: "success" },
  { id: "ctf", name: "CTF Challenges", color: "error" },
  { id: "off-topic", name: "Off-Topic", color: "warning" },
];

interface ForumThreadCardProps {
  thread: ForumThreadMapped;
  mode?: "full" | "compact";
  showCategory?: boolean;
}

export function ForumThreadCard({ thread, mode = "full", showCategory = true }: ForumThreadCardProps) {
  const navigate = useNavigate();
  const dbCategory = thread.category;
  const mockCategory = defaultCategories.find((c) => c.id === thread.categoryId);
  
  const [likes, setLikes] = useState(thread.likes);
  const [userVote, setUserVote] = useState(thread.userVote);
  const [voteAnimate, setVoteAnimate] = useState<string | undefined>(thread.voteAnimate);

  const handleVoteAction = async (direction: "up" | "down") => {
    try {
      const val = direction === "up" ? 1 : -1;
      const res = await voteThread(thread.id, val);
      setLikes(res.vote_score);
      setUserVote(res.user_vote);
      setVoteAnimate(direction === "up" ? "animate-vote-up" : "animate-vote-down");
    } catch (err) {
      console.error("Failed to vote thread from card:", err);
    }
  };

  const categoryName = dbCategory?.name || mockCategory?.name || "General Discussion";
  const categoryColor = dbCategory?.color || mockCategory?.color || "primary";

  const getCategoryColorVariant = (colorName?: string) => {
    const map: Record<string, "primary" | "accent" | "success" | "warning" | "error" | "info" | "neutral"> = {
      primary: "primary",
      accent: "accent",
      success: "success",
      error: "error",
      warning: "warning",
    };
    return map[colorName || ""] || "neutral";
  };

  const badgeVariant = getCategoryColorVariant(categoryColor);

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (thread.authorUsername) {
      navigate(`/app/u/${thread.authorUsername}`);
    } else {
      navigate(`/app/profile/${thread.authorId}`);
    }
  };

  if (mode === "compact") {
    return (
      <Link
        to={`/app/forums/thread/${thread.id}`}
        className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <div
          onClick={handleAuthorClick}
          className="w-9 h-9 rounded-full bg-surface-700 flex-shrink-0 mt-0.5 overflow-hidden hover:opacity-85 transition-opacity"
        >
          <img
            src={thread.authorAvatar}
            alt={thread.author}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors truncate">
            {thread.title}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Posted by <span onClick={handleAuthorClick} className="hover:text-primary transition-colors font-medium text-text-secondary cursor-pointer">{thread.author}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted mt-1.5">
            <VoteControl
              score={likes}
              userVote={userVote}
              onVote={handleVoteAction}
              orientation="horizontal"
              size="md"
              animateClass={voteAnimate}
            />
            <span>·</span>
            <span>{thread.createdAt}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> {thread.replyCount} comments
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted flex-shrink-0">
          {thread.poll && (
            <Badge variant="accent" className="px-1.5 py-0">
              <BarChart2 className="w-2.5 h-2.5" />
            </Badge>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Card hoverEffect glowColor="primary" className="p-4 sm:p-5 group">
      <Link to={`/app/forums/thread/${thread.id}`} className="block">
        <div className="flex items-start gap-4">
          <div
            onClick={handleAuthorClick}
            className="w-10 h-10 rounded-full bg-surface-700 flex-shrink-0 mt-0.5 overflow-hidden hover:opacity-85 transition-opacity border border-border/40"
          >
            <img
              src={thread.authorAvatar}
              alt={thread.author}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {thread.pinned && (
                <Badge variant="warning">
                  <Pin className="w-3 h-3" /> Pinned
                </Badge>
              )}
              {thread.solved && (
                <Badge variant="success">
                  <CheckCircle className="w-3 h-3" /> Solved
                </Badge>
              )}
              {thread.poll && (
                <Badge variant="accent">
                  <BarChart2 className="w-3 h-3" /> Poll
                </Badge>
              )}
              {showCategory && (
                <Badge variant={badgeVariant}>
                  {categoryName}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors mb-1">
              {thread.title}
            </h3>

            {/* Author info */}
            <p className="text-xs text-text-muted mb-2">
              Posted by <span onClick={handleAuthorClick} className="hover:text-primary transition-colors font-medium text-text-secondary cursor-pointer">{thread.author}</span>
            </p>
            
            {/* Snippet */}
            <p className="text-sm text-text-muted line-clamp-1 mb-3">
              {(() => {
                const cleanText = thread.content
                  .replace(/(?:\|\|)([^\s].*?[^\s]|[^\s])(?:\|\|)/g, '<span class="px-1.5 rounded font-mono select-none" style="background-color: #0c0f17; color: transparent; border: 1px solid rgba(239, 68, 68, 0.2); user-select: none;">$1</span>')
                  .replace(/(?:&gt;!|>!)([^\s].*?[^\s]|[^\s])(?:!&lt;|!<)/g, '<span class="px-1.5 rounded font-mono select-none" style="background-color: #0c0f17; color: transparent; border: 1px solid rgba(239, 68, 68, 0.2); user-select: none;">$1</span>');
                return <span dangerouslySetInnerHTML={{ __html: cleanText }} />;
              })()}
            </p>

            {/* Footer metrics */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
              <VoteControl
                score={likes}
                userVote={userVote}
                onVote={handleVoteAction}
                orientation="horizontal"
                size="md"
                animateClass={voteAnimate}
              />
              <span>{thread.createdAt}</span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> {thread.replyCount} comments
              </span>
              <span className="hidden sm:inline-flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {thread.views} views
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
