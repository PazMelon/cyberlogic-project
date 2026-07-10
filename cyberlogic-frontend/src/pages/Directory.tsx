import { useState, useEffect } from "react";
import { fetchDirectory, type DirectoryMember } from "../utils/api";
import { DirectoryHeader } from "../components/directory/DirectoryHeader";
import { DirectoryFilters } from "../components/directory/DirectoryFilters";
import { DirectoryCard } from "../components/directory/DirectoryCard";
import { DirectorySkeleton } from "../components/directory/DirectorySkeleton";
import { useWebSocket } from "../context/WebSocketContext";
import { useSEO } from "../utils/useSEO";

export default function Directory() {
  useSEO({
    title: "Member Directory",
    description: "Browse members and officers of Cyberlogic Club, view their roles, and connect with them.",
  });

  const { onlineUsers } = useWebSocket();
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDirectory = async () => {
      try {
        const data = await fetchDirectory();
        setMembers(data);
      } catch (err: any) {
        console.error("Failed to load directory", err);
        setError("Failed to load member directory. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };
    loadDirectory();
  }, []);

  // Map real-time statuses from WebSockets presence channel
  const membersWithRealtimeStatus = members.map((m) => {
    const activeUser = onlineUsers.find((u) => u.id === m.id);
    return {
      ...m,
      status: activeUser ? (activeUser.status || "online") : "offline",
    };
  });

  const filtered = membersWithRealtimeStatus.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.expertise.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === "All" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const onlineCount = membersWithRealtimeStatus.filter((m) => m.status === "online" || m.status === "away").length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3.5 rounded-xl bg-error/15 border border-error/35 text-xs text-error font-medium animate-fadeIn">
          {error}
        </div>
      )}

      <DirectoryHeader totalCount={members.length} onlineCount={onlineCount} />

      <DirectoryFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <DirectorySkeleton />
        ) : (
          filtered.map((member) => (
            <DirectoryCard
              key={member.id}
              member={member}
              isExpanded={expandedId === member.id}
              onToggleExpand={() => setExpandedId(expandedId === member.id ? null : member.id)}
            />
          ))
        )}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 animate-fadeIn">
          <p className="text-text-muted">No members found matching the criteria.</p>
        </div>
      )}
    </div>
  );
}
