import { Link } from "react-router";
import {
  Megaphone,
  MessageSquare,
  User,
  BookOpen,
  Calendar,
  Download,
  ChevronRight,
  ThumbsUp,
} from "lucide-react";

interface SearchResultCardProps {
  type: "announcement" | "forum" | "profile" | "blog" | "event" | "resource";
  data: any;
  onClick?: () => void;
}

export default function SearchResultCard({ type, data, onClick }: SearchResultCardProps) {
  const getIcon = () => {
    switch (type) {
      case "announcement":
        return <Megaphone className="w-4 h-4 text-primary" />;
      case "forum":
        return <MessageSquare className="w-4 h-4 text-accent" />;
      case "profile":
        return <User className="w-4 h-4 text-info" />;
      case "blog":
        return <BookOpen className="w-4 h-4 text-success" />;
      case "event":
        return <Calendar className="w-4 h-4 text-warning" />;
      case "resource":
        return <Download className="w-4 h-4 text-primary-light" />;
      default:
        return <BookOpen className="w-4 h-4 text-text-muted" />;
    }
  };

  const getLink = () => {
    switch (type) {
      case "announcement":
        return `/app/announcements/${data.id}`;
      case "forum":
        return `/app/forums/thread/${data.id}`;
      case "profile":
        return `/app/profile/${data.id}`;
      case "blog":
        return `/app/blogs/${data.id}`;
      case "event":
        return `/app/events/${data.id}`;
      case "resource":
        return `/app/resources`; // Navigate to resources page
      default:
        return "/app";
    }
  };

  const getBadgeColor = () => {
    switch (type) {
      case "announcement":
        return "bg-primary/10 text-primary border-primary/20";
      case "forum":
        return "bg-accent/10 text-accent border-accent/20";
      case "profile":
        return "bg-info/10 text-info border-info/20";
      case "blog":
        return "bg-success/10 text-success border-success/20";
      case "event":
        return "bg-warning/10 text-warning border-warning/20";
      case "resource":
        return "bg-primary-light/10 text-primary-light border-primary-light/20";
      default:
        return "bg-surface-700 text-text-muted border-border";
    }
  };

  const renderContent = () => {
    switch (type) {
      case "announcement":
        return (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getBadgeColor()}`}>
                Announcement
              </span>
              <span className="text-[10px] text-text-muted">{data.date}</span>
            </div>
            <h4 className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
              {data.title}
            </h4>
            <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
              {data.excerpt}
            </p>
          </div>
        );
      case "forum":
        return (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getBadgeColor()}`}>
                Forum
              </span>
              <span className="text-[10px] text-text-muted">by {data.author}</span>
              <span className="text-[10px] text-text-muted">• {data.createdAt}</span>
            </div>
            <h4 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
              {data.title}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" /> {data.likes || 0}
              </span>
              <span>•</span>
              <span>{data.replyCount || 0} replies</span>
            </div>
          </div>
        );
      case "profile":
        return (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={data.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=" + data.name}
              alt={data.name}
              className="w-10 h-10 rounded-full border border-border bg-surface-800 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-text-primary truncate">
                  {data.name}
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getBadgeColor()}`}>
                  {data.role}
                </span>
              </div>
              <p className="text-xs text-text-muted truncate mt-0.5">
                {data.department}
              </p>
            </div>
          </div>
        );
      case "blog":
        return (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getBadgeColor()}`}>
                Blog
              </span>
              <span className="text-[10px] text-text-muted">{data.date}</span>
            </div>
            <h4 className="text-sm font-semibold text-text-primary truncate group-hover:text-success transition-colors">
              {data.title}
            </h4>
            <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
              {data.excerpt}
            </p>
          </div>
        );
      case "event":
        return (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getBadgeColor()}`}>
                Event
              </span>
              <span className="text-[10px] text-text-muted">{data.date}</span>
              <span className="text-[10px] text-text-muted">• {data.type}</span>
            </div>
            <h4 className="text-sm font-semibold text-text-primary truncate group-hover:text-warning transition-colors">
              {data.title}
            </h4>
            <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
              {data.description}
            </p>
          </div>
        );
      case "resource":
        return (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getBadgeColor()}`}>
                Resource
              </span>
              <span className="text-[10px] text-text-muted">{data.category}</span>
            </div>
            <h4 className="text-sm font-semibold text-text-primary truncate group-hover:text-primary-light transition-colors">
              {data.title}
            </h4>
            <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
              {data.description}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Link
      to={getLink()}
      onClick={onClick}
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-border transition-all duration-200 group"
    >
      <div className="p-2 rounded-lg bg-surface-800 border border-border group-hover:border-transparent transition-all flex items-center justify-center shrink-0">
        {getIcon()}
      </div>
      {renderContent()}
      <div className="self-center text-text-muted opacity-0 group-hover:opacity-100 transition-opacity pl-2">
        <ChevronRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
