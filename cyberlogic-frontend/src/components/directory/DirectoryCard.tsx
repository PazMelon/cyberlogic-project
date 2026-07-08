import { Link } from "react-router";
import { Mail, MapPin, Award, ChevronDown, ChevronUp } from "lucide-react";
import { Card, Badge, Button } from "../ui";
import type { DirectoryMember } from "../../utils/api";

const statusColors: Record<string, string> = {
  online: "bg-success",
  offline: "bg-text-muted",
  away: "bg-warning",
};

interface DirectoryCardProps {
  member: DirectoryMember;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function DirectoryCard({ member, isExpanded, onToggleExpand }: DirectoryCardProps) {
  return (
    <Card
      hoverEffect
      glowColor="primary"
      className="p-5 flex flex-col justify-between h-full animate-fadeIn"
    >
      <div>
        {/* Top Bar: Avatar & Role */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative flex-shrink-0">
            <img
              src={member.avatar}
              alt={member.name}
              className="w-14 h-14 rounded-full bg-surface-700 object-cover"
            />
            <span
              className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-950 ${
                statusColors[member.status] || "bg-text-muted"
              }`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-text-primary truncate">
              {member.name}
            </h3>
            <p className="text-xs text-primary font-medium mt-0.5">
              {member.role}
            </p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
              {member.department}
            </p>
          </div>
        </div>

        {/* Badges */}
        {member.badges && member.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {member.badges.map((badge) => (
              <Badge
                key={badge}
                variant="accent"
                className="font-bold tracking-wider text-[10px] py-0.5"
              >
                <Award className="w-2.5 h-2.5" /> {badge}
              </Badge>
            ))}
          </div>
        )}

        {/* Skills/Expertise */}
        {member.expertise && member.expertise.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {member.expertise.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded bg-surface-800 border border-border/50 text-[10px] text-text-secondary"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Expanded Bio Info */}
        {isExpanded && (
          <div className="pt-3 border-t border-border/50 text-xs text-text-secondary space-y-2 mt-2 animate-fadeIn">
            <p className="leading-relaxed">{member.bio}</p>
            <div className="flex items-center gap-1.5 text-text-muted">
              <MapPin className="w-3.5 h-3.5" />
              <span>Year: {member.yearLevel}</span>
            </div>
            <div className="flex items-center gap-1.5 text-text-muted">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Toolbar: Action Buttons */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
        <Button
          variant="secondary"
          onClick={onToggleExpand}
          className="flex-1 py-1.5 text-xs font-semibold flex items-center justify-center gap-1"
          icon={isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          iconPosition="right"
        >
          {isExpanded ? "Collapse" : "View Bio"}
        </Button>
        <Link
          to={`/app/profile/${member.id}`}
          className="px-3 py-1.5 text-center text-xs font-semibold rounded-lg bg-gradient-to-r from-primary to-accent hover:shadow-md hover:shadow-primary/10 text-white transition-all"
        >
          Profile
        </Link>
      </div>
    </Card>
  );
}
export type { DirectoryMember };
