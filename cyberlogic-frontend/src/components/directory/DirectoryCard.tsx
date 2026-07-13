import { Link } from "react-router";
import { Card } from "../ui";
import type { DirectoryMember } from "../../utils/api";

const statusColors: Record<string, string> = {
  online: "bg-success",
  offline: "bg-text-muted",
  away: "bg-warning",
};

interface DirectoryCardProps {
  member: DirectoryMember;
}

export function DirectoryCard({ member }: DirectoryCardProps) {
  return (
    <Link
      to={member.username ? `/app/u/${member.username}` : `/app/profile/${member.id}`}
      className="block h-full group select-none"
    >
      <Card
        hoverEffect
        glowColor="primary"
        className="p-6 flex flex-col items-center text-center justify-center h-full animate-fadeIn border border-border/40 hover:border-primary/40 transition-all duration-300 bg-surface-900/40 backdrop-blur-sm"
      >
        {/* Profile Pic in Circle */}
        <div className="relative mb-3.5">
          <img
            src={member.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${member.name}`}
            alt={member.name}
            className="w-20 h-20 rounded-full bg-surface-700 object-cover border-2 border-border group-hover:border-primary/50 transition-colors duration-300"
          />
          <span
            className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-surface-950 ${
              statusColors[member.status] || "bg-text-muted"
            }`}
          />
        </div>

        {/* Identity Details */}
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors duration-200 line-clamp-1">
            {member.name}
          </h3>
          <p className="text-xs font-semibold text-primary capitalize">
            {member.role}
          </p>
          <div className="text-[10px] text-text-muted space-y-0.5 pt-0.5">
            <p className="font-medium truncate">{member.department}</p>
            {member.yearLevel && member.yearLevel !== "N/A" && (
              <p className="font-medium font-mono">{member.yearLevel}</p>
            )}
          </div>
        </div>

        {/* Skillsets / Expertise */}
        {member.expertise && member.expertise.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mt-3 pt-3 border-t border-border/20 w-full">
            {member.expertise.slice(0, 3).map((exp, idx) => (
              <span
                key={idx}
                className="text-[9px] px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary-400 font-medium whitespace-nowrap"
              >
                {exp}
              </span>
            ))}
            {member.expertise.length > 3 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-800 text-text-muted font-medium whitespace-nowrap">
                +{member.expertise.length - 3}
              </span>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
export type { DirectoryMember };

