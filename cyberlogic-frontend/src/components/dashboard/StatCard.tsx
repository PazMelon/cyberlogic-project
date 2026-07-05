import { TrendingUp, type LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change: string;
  color: string;
}

export function StatCard({ icon: Icon, label, value, change, color }: StatCardProps) {
  return (
    <div className="glass rounded-xl p-4 hover:border-primary/20 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}`} />
        </div>
        <TrendingUp className="w-4 h-4 text-success opacity-60" />
      </div>
      <div className="text-2xl font-bold text-text-primary font-[family-name:var(--font-heading)]">
        {value}
      </div>
      <div className="text-xs text-text-muted mt-0.5">{label}</div>
      <div className="text-[10px] text-text-muted mt-1 opacity-70">{change}</div>
    </div>
  );
}
