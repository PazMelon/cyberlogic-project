import React from "react";
import type { CyberboardCard, CyberboardColumn } from "../../../utils/api";
import PhaseBadge from "../ui/PhaseBadge";
import InlineSubtaskCreator from "./InlineSubtaskCreator";

interface CardSubtasksListProps {
  card: CyberboardCard;
  allBoardCards: CyberboardCard[];
  columns: CyberboardColumn[];
  safeBoardPhases: Array<{ name: string; color: string }>;
  canEditCard: boolean;
  onShowToast?: (text: string, type?: "error" | "info" | "success") => void;
}

export const CardSubtasksList: React.FC<CardSubtasksListProps> = ({
  card,
  allBoardCards = [],
  columns = [],
  safeBoardPhases = [],
  canEditCard,
  onShowToast,
}) => {
  const liveSubcards = (allBoardCards || []).filter(
    (c) => c.parent_id === card.id && !c.is_archived
  );
  const subcardsList = liveSubcards.length > 0 ? liveSubcards : card.sub_cards || [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          Sub-Tasks ({subcardsList.length})
        </h4>
      </div>

      {subcardsList.length > 0 && (
        <div className="space-y-1.5 bg-surface-800/40 p-3 rounded-xl border border-border/50">
          {subcardsList.map((subCard) => {
            const subCol = (columns || []).find((c) => c.id === subCard.column_id);
            const lastColPosition = (columns || []).reduce(
              (max, c) => Math.max(max, c.position ?? 0),
              0
            );
            const isSubColDone =
              subCol &&
              (subCol.status_type === "completed" ||
                subCol.title.toLowerCase().includes("done") ||
                subCol.title.toLowerCase().includes("completed") ||
                (subCol.position !== undefined &&
                  subCol.position === lastColPosition &&
                  lastColPosition > 0));

            return (
              <div
                key={subCard.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                  isSubColDone
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-surface-800 border-border/40 text-text-primary hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      isSubColDone ? "bg-emerald-400 ring-2 ring-emerald-400/30" : "bg-primary"
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      isSubColDone ? "text-emerald-300 line-through" : "text-text-primary"
                    }`}
                  >
                    {subCard.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {subCard.phase && (
                    <PhaseBadge phase={subCard.phase} boardPhases={safeBoardPhases} size="sm" />
                  )}

                  {subCol && (
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        isSubColDone
                          ? "text-emerald-300 bg-emerald-500/20 border-emerald-500/40"
                          : "text-text-muted bg-surface-700/50 border-border/50"
                      }`}
                    >
                      {isSubColDone ? "Completed" : subCol.title}
                    </span>
                  )}

                  {subCard.assigned_user && (
                    <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      @{subCard.assigned_user.username || subCard.assigned_user.first_name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canEditCard && (
        <InlineSubtaskCreator
          boardId={columns && columns.length > 0 ? columns[0].board_id : 0}
          parentCard={card}
          columnId={card.column_id}
          boardPhases={safeBoardPhases}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};

export default CardSubtasksList;
