import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Search, Mail, MapPin, Award, ChevronDown, ChevronUp } from "lucide-react";
import { directoryMembers } from "../data/mockData";
import { SkeletonCircle, SkeletonLine } from "../components/Skeleton";

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, department, expertise..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary/50 transition-all appearance-none pr-10 cursor-pointer"
          >
            {roleFilters.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <SkeletonCircle className="w-14 h-14 bg-surface-800" />
                  <div className="space-y-2 flex-1">
                    <SkeletonLine widthClass="w-3/4" heightClass="h-4.5" />
                    <SkeletonLine widthClass="w-1/2" heightClass="h-3" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <SkeletonLine widthClass="w-full" heightClass="h-3.5" />
                  <div className="flex gap-2">
                    <SkeletonLine widthClass="w-12" heightClass="h-4" />
                    <SkeletonLine widthClass="w-14" heightClass="h-4" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          filtered.map((member) => {
            const isExpanded = expandedId === member.id;

            return (
              <div
                key={member.id}
                className="glass rounded-2xl p-5 hover:border-primary/20 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Avatar & Role */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
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
                  {member.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {member.badges.map((badge) => (
                        <span
                          key={badge}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-accent/10 border border-accent/20 text-accent uppercase tracking-wider"
                        >
                          <Award className="w-2.5 h-2.5" /> {badge}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Skills/Expertise */}
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

                  {/* Expanded Bio Info */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-border/50 text-xs text-text-secondary space-y-2 mt-2 animate-fadeIn">
                      <p className="leading-relaxed">{member.bio}</p>
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Year: {member.yearLevel}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{member.email}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Toolbar: Action Buttons */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : member.id)}
                    className="flex-1 py-1.5 text-center text-xs font-semibold rounded-lg bg-surface-850 hover:bg-surface-800 text-text-primary border border-border transition-all flex items-center justify-center gap-1"
                  >
                    <span>{isExpanded ? "Collapse" : "View Bio"}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <Link
                    to={`/app/profile/${member.id}`}
                    className="px-3 py-1.5 text-center text-xs font-semibold rounded-lg bg-gradient-to-r from-primary to-accent hover:shadow-md hover:shadow-primary/10 text-white transition-all"
                  >
                    Profile
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted">No members found matching the criteria.</p>
        </div>
      )}
    </div>
  );
}
