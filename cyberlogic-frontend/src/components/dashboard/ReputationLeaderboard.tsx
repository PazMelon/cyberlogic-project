import { useState } from "react";
import { Link } from "react-router";
import { Award, Trophy } from "lucide-react";
import { directoryMembers } from "../../data/mockData";

type Timeframe = "week" | "month" | "year" | "allTime";

export function ReputationLeaderboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>("week");

  // Get directory members, sort them, and take the top 10
  const leaderboardData = [...directoryMembers]
    .map((member) => ({
      ...member,
      score: member.reputation ? member.reputation[timeframe] : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  const timeframes: { id: Timeframe; label: string }[] = [
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
    { id: "allTime", label: "All-Time" },
  ];

  return (
    <div className="glass rounded-2xl p-5 h-[390px] flex flex-col">
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
            className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
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
        {leaderboardData.map((member, index) => {
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
                  {member.score.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
