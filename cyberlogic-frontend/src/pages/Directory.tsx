import { useState } from "react";
import { Link } from "react-router";
import {
  Search,
  Mail,
  MapPin,
  Award,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { directoryMembers } from "../data/mockData";

const roleFilters = ["All", "President", "Vice President", "Secretary", "Treasurer", "Tech Lead", "Events Coordinator", "Member", "Alumni"] as const;
const statusColors: Record<string, string> = {
  online: "bg-success",
  offline: "bg-text-muted",
  away: "bg-warning",
};

export default function Directory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = directoryMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.expertise.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === "All" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const onlineCount = directoryMembers.filter((m) => m.status === "online").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
          Member Directory
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {directoryMembers.length} members · {onlineCount} online now
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, department, or expertise..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {roleFilters.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                roleFilter === role
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-surface-800 text-text-muted hover:border-primary/20"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Member Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((member) => {
          const isExpanded = expandedId === member.id;

          return (
            <div
              key={member.id}
              className={`glass rounded-2xl p-5 transition-all duration-300 group ${
                isExpanded ? "border-primary/30 ring-1 ring-primary/10" : "hover:border-primary/20"
              }`}
            >
              {/* Top */}
              <div className="flex items-start gap-3 mb-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-12 h-12 rounded-full bg-surface-700"
                  />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-800 ${statusColors[member.status]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary truncate">{member.name}</h3>
                  <p className="text-xs text-primary font-medium">{member.role}</p>
                  <p className="text-xs text-text-muted">
                    {member.department} · {member.yearLevel}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {member.badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent"
                  >
                    <Award className="w-2.5 h-2.5" /> {badge}
                  </span>
                ))}
              </div>

              {/* Expertise Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {member.expertise.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-surface-700 text-text-muted"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Expand Toggle */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : member.id)}
                className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-text-muted hover:text-primary hover:bg-white/5 transition-colors"
              >
                {isExpanded ? (
                  <>
                    Less <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    More <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border space-y-2.5 animate-fade-in">
                  <p className="text-xs text-text-secondary leading-relaxed">{member.bio}</p>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{member.department}</span>
                  </div>
                  <div className="text-xs text-text-muted">
                    Member since {new Date(member.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>
                  <div className="pt-2">
                    <Link
                      to={`/app/profile/${member.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40 text-xs font-semibold text-primary hover:text-primary-light transition-all"
                    >
                      View Full Profile
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-muted">No members found matching your search.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("All");
            }}
            className="mt-2 text-sm text-primary hover:text-primary-light flex items-center gap-1 mx-auto"
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
