import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { type ReactNode, Fragment } from "react";

interface DashboardCardProps {
  title: string;
  viewAllPath?: string;
  viewAllLabel?: string;
  accentColor?: "primary" | "accent";
  isLoading: boolean;
  skeletonCount?: number;
  renderSkeleton: () => ReactNode;
  isEmpty: boolean;
  renderEmpty: () => ReactNode;
  children: ReactNode;
  className?: string;
}

export function DashboardCard({
  title,
  viewAllPath,
  viewAllLabel = "View all",
  accentColor = "primary",
  isLoading,
  skeletonCount = 3,
  renderSkeleton,
  isEmpty,
  renderEmpty,
  children,
  className = ""
}: DashboardCardProps) {
  const textLinkColor = accentColor === "accent" ? "text-accent hover:text-accent-light" : "text-primary hover:text-primary-light";
  
  return (
    <div className={`glass rounded-2xl p-5 flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-heading)]">
          {title}
        </h2>
        {viewAllPath && (
          <Link
            to={viewAllPath}
            className={`text-xs font-medium ${textLinkColor} transition-colors flex items-center gap-1`}
          >
            {viewAllLabel} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {isLoading ? (
            <>
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <Fragment key={i}>
                  {renderSkeleton()}
                </Fragment>
              ))}
            </>
          ) : isEmpty ? (
            renderEmpty()
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
