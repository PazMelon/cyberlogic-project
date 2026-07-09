import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Award, Trophy } from "lucide-react";
import { fetchReputationLeaderboard, type ReputationUser } from "../../utils/api";

type Timeframe = "week" | "month" | "year" | "allTime";

export function ReputationLeaderboard({ className = "h-[390px]" }: { className?: string }) {
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [leaderboardData, setLeaderboardData] = useState<ReputationUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);
        const data = await fetchReputationLeaderboard(timeframe);
        setLeaderboardData(data);
      } catch (err) {
        console.error("Failed to load reputation leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadLeaderboard();
  }, [timeframe]);

  const timeframes: { id: Timeframe; label: string }[] = [
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
    { id: "allTime", label: "All-Time" },
  ];

  return (
    <div className={`glass rounded-2xl p-5 flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-heading)] flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Member Leaderboard
        </h2>
      </div>

      {/* Timeframe Selector Tabs */}
      <div className="flex border-b border-border/50 mb-4 p-0.5 bg-surface-950/40 rounded-lg">
        {timeframes.map((tf) => (
          <button
            key={tf.id}
            onClick={() => setTimeframe(tf.id)}
            className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              timeframe === tf.id
                ? "bg-primary/20 text-primary border border-primary/20 shadow-sm"
                : "text-text-muted hover:text-text-primary hover:bg-white/5"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-2 animate-pulse">
              <div className="flex items-center gap-3 w-2/3">
                <div className="w-6 h-6 rounded bg-surface-800" />
                <div className="w-8 h-8 rounded-full bg-surface-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-1/2 h-3.5 rounded bg-surface-800" />
                  <div className="w-1/3 h-2.5 rounded bg-surface-800" />
                </div>
              </div>
              <div className="w-12 h-5 rounded-full bg-surface-800" />
            </div>
          ))
        ) : leaderboardData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-xs text-text-muted">No member activities recorded yet.</p>
          </div>
        ) : (
          leaderboardData.map((member, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            
            let rankColor = "text-text-muted bg-surface-900/40 border border-border/30";
            let medalIcon = null;
            
            if (rank === 1) {
              rankColor = "bg-warning/20 text-warning border border-warning/30 shadow-[0_0_10px_rgba(234,179,8,0.15)]";
              medalIcon = "🥇";
            } else if (rank === 2) {
              rankColor = "bg-accent/20 text-accent border border-accent/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]";
              medalIcon = "🥈";
            } else if (rank === 3) {
              rankColor = "bg-orange-500/25 text-orange-400 border border-orange-500/30";
              medalIcon = "🥉";
            }

            const score = member.reputation ? member.reputation[timeframe] : 0;

            return (
              <div
                key={member.id}
                className={`flex items-center justify-between p-2 rounded-xl transition-all hover:bg-white/5 border border-transparent hover:border-border/40 ${
                  isTop3 ? "bg-surface-900/10" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Badge */}
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${rankColor}`}>
                    {medalIcon || rank}
                  </span>

                  {/* Avatar and Info */}
                  <Link to={`/app/profile/${member.id}`} className="group/avatar flex items-center gap-2.5 min-w-0">
                    <img
                      src={member.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${member.name}`}
                      alt={member.name}
                      className="w-8 h-8 rounded-full border border-border/40 object-cover group-hover/avatar:border-primary/50 transition-colors"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary group-hover/avatar:text-primary transition-colors truncate">
                        {member.name}
                      </p>
                      <p className="text-[10px] text-text-muted truncate">
                        {member.role}
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Reputation points */}
                <div className="text-right shrink-0">
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    rank === 1
                      ? "bg-warning/10 text-warning"
                      : rank === 2
                      ? "bg-accent/10 text-accent"
                      : "bg-primary/10 text-primary"
                  }`}>
                    <Award className="w-3 h-3" />
                    {score.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
