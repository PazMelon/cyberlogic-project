import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Plus, AlertCircle, Lock } from "lucide-react";
import {
  fetchCyberboardBoard,
  createCyberboardCard,
  updateCyberboardCard,
  deleteCyberboardCard,
  moveCyberboardCard,
  toggleCyberboardCardVote,
  createCyberboardCardComment,
  deleteCyberboardCardComment,
  createCyberboardColumn,
  updateCyberboardColumn,
  deleteCyberboardColumn,
  reorderCyberboardColumns,
  updateCyberboardBoard,
  deleteCyberboardBoard,
  type CyberboardBoard,
  type CyberboardCard,
  type CyberboardColumn,
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useCyberboardRealtime } from "../hooks/useCyberboardRealtime";
import BoardHeader from "../components/cyberboard/BoardHeader";
import BoardColumn from "../components/cyberboard/BoardColumn";
import GanttRoadmapView from "../components/cyberboard/GanttRoadmapView";
import CollaboratorsSidebar from "../components/cyberboard/CollaboratorsSidebar";
import LiveCursorsOverlay from "../components/cyberboard/LiveCursorsOverlay";
import MobileNoticeBanner from "../components/cyberboard/MobileNoticeBanner";
import { Toast } from "../components/ui";
import CardDetailModal from "../components/cyberboard/CardDetailModal";
import NewSuggestionModal from "../components/cyberboard/NewSuggestionModal";
import AddColumnModal from "../components/cyberboard/AddColumnModal";
import ConfigureColumnModal from "../components/cyberboard/ConfigureColumnModal";
import BoardSettingsModal from "../components/cyberboard/BoardSettingsModal";
import BoardAuditLogDrawer from "../components/cyberboard/BoardAuditLogDrawer";
import ConfirmModal from "../components/cyberboard/ConfirmModal";

export default function CyberBoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const numericBoardId = boardId ? parseInt(boardId, 10) : null;

  const { user, isAdmin } = useAuth();

  const [board, setBoard] = useState<CyberboardBoard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toast and Confirm Modal state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "error" | "info" | "success" } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showToast = useCallback((text: string, type: "error" | "info" | "success" = "error") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Modals state
  const [selectedCard, setSelectedCard] = useState<CyberboardCard | null>(null);
  const [showNewSuggestionModal, setShowNewSuggestionModal] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<number | undefined>(undefined);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [showBoardSettingsModal, setShowBoardSettingsModal] = useState(false);
  const [showBoardAuditLog, setShowBoardAuditLog] = useState(false);
  const [selectedColumnToConfigure, setSelectedColumnToConfigure] = useState<CyberboardColumn | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [viewMode, setViewMode] = useState<"board" | "gantt">("board");

  // Load board data
  const loadBoard = useCallback(async () => {
    if (!numericBoardId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCyberboardBoard(numericBoardId);
      setBoard(data);
      if (data?.type === "roadmap") {
        setViewMode("gantt");
      }
    } catch (err: any) {
      console.error("Failed to load board details:", err);
      setError(err.message || "Failed to load board details.");
    } finally {
      setIsLoading(false);
    }
  }, [numericBoardId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    if (board?.title) {
      document.title = `${board.title} - CyberBoard | Cyberlogic`;
    } else {
      document.title = "CyberBoard | Cyberlogic";
    }
  }, [board?.title]);

  // Real-time WebSocket board event handler
  const handleWsBoardEvent = useCallback(
    (payload: any, type: string) => {
      if (!payload) return;

      if (type === "card:created") {
        const newCard: CyberboardCard = payload.card;
        setBoard((prev) => {
          if (!prev || !prev.columns) return prev;
          const updatedColumns = prev.columns.map((col) => {
            if (col.id === newCard.column_id) {
              const existingCards = col.cards || [];
              if (existingCards.some((c) => c.id === newCard.id)) return col;
              return { ...col, cards: [...existingCards, newCard] };
            }
            return col;
          });
          return { ...prev, columns: updatedColumns };
        });
      } else if (type === "card:updated") {
        const updatedCard: CyberboardCard = payload.card;
        setBoard((prev) => {
          if (!prev || !prev.columns) return prev;
          const updatedColumns = prev.columns.map((col) => {
            const cards = (col.cards || []).map((c) =>
              c.id === updatedCard.id ? { ...c, ...updatedCard } : c
            );
            return { ...col, cards };
          });
          return { ...prev, columns: updatedColumns };
        });
        setSelectedCard((prev) => (prev?.id === updatedCard.id ? updatedCard : prev));
      } else if (type === "card:deleted") {
        const cardId: number = payload.card_id;
        setBoard((prev) => {
          if (!prev || !prev.columns) return prev;
          const updatedColumns = prev.columns.map((col) => ({
            ...col,
            cards: (col.cards || []).filter((c) => c.id !== cardId),
          }));
          return { ...prev, columns: updatedColumns };
        });
        setSelectedCard((prev) => (prev?.id === cardId ? null : prev));
      } else if (type === "card:moved") {
        const { card_id, to_column_id, position, moved_by_user_id, activities } = payload;

        // Show toast notification if another collaborator moved a card
        if (moved_by_user_id && moved_by_user_id !== user?.id) {
          setBoard((latestBoard) => {
            if (latestBoard?.columns) {
              const targetCol = latestBoard.columns.find((c) => c.id === to_column_id);
              let movedCardTitle = "";
              for (const col of latestBoard.columns) {
                const foundCard = (col.cards || []).find((c) => c.id === card_id);
                if (foundCard) {
                  movedCardTitle = foundCard.title;
                  break;
                }
              }
              if (targetCol && movedCardTitle) {
                showToast(`Collaborator moved '${movedCardTitle}' to '${targetCol.title}'.`, "info");
              }
            }
            return latestBoard;
          });
        }

        setBoard((prev) => {
          if (!prev || !prev.columns) return prev;

          let targetCard: CyberboardCard | null = null;
          for (const col of prev.columns) {
            const found = (col.cards || []).find((c) => c.id === card_id);
            if (found) {
              targetCard = {
                ...found,
                column_id: to_column_id,
                position,
                ...(activities ? { activities } : {}),
              };
              break;
            }
          }

          if (!targetCard) return prev;

          const updatedColumns = prev.columns.map((col) => {
            let cards = (col.cards || []).filter((c) => c.id !== card_id);
            if (col.id === to_column_id) {
              cards.splice(position, 0, targetCard!);
            }
            return { ...col, cards };
          });

          return { ...prev, columns: updatedColumns };
        });

        setSelectedCard((prev) => {
          if (prev && prev.id === card_id) {
            return {
              ...prev,
              column_id: to_column_id,
              position,
              ...(activities ? { activities } : {}),
            };
          }
          return prev;
        });
      } else if (type === "card:voted") {
        const { card_id, votes_count, voted_by_user_id, has_voted, activities } = payload;
        const isMe = user?.id === voted_by_user_id;

        setBoard((prev) => {
          if (!prev || !prev.columns) return prev;
          const updatedColumns = prev.columns.map((col) => {
            const cards = (col.cards || []).map((c) => {
              if (c.id === card_id) {
                return {
                  ...c,
                  votes_count,
                  has_voted: isMe ? has_voted : c.has_voted,
                  ...(activities ? { activities } : {}),
                };
              }
              return c;
            });
            return { ...col, cards };
          });
          return { ...prev, columns: updatedColumns };
        });

        setSelectedCard((prev) => {
          if (prev && prev.id === card_id) {
            return {
              ...prev,
              votes_count,
              has_voted: isMe ? has_voted : prev.has_voted,
              ...(activities ? { activities } : {}),
            };
          }
          return prev;
        });
      } else if (type === "card:commented") {
        const { card_id, comment } = payload;
        setBoard((prev) => {
          if (!prev || !prev.columns) return prev;
          const updatedColumns = prev.columns.map((col) => {
            const cards = (col.cards || []).map((c) => {
              if (c.id === card_id) {
                const existingComments = c.comments || [];
                if (existingComments.some((cm) => cm.id === comment.id)) return c;
                const commentsCount = (c.comments_count || 0) + 1;
                return {
                  ...c,
                  comments_count: commentsCount,
                  comments: [...existingComments, comment],
                };
              }
              return c;
            });
            return { ...col, cards };
          });
          return { ...prev, columns: updatedColumns };
        });

        setSelectedCard((prev) => {
          if (prev && prev.id === card_id) {
            const existingComments = prev.comments || [];
            if (existingComments.some((cm) => cm.id === comment.id)) return prev;
            return {
              ...prev,
              comments_count: (prev.comments_count || 0) + 1,
              comments: [...existingComments, comment],
            };
          }
          return prev;
        });
      } else if (type === "comment:deleted") {
        const { card_id, comment_id } = payload;
        setBoard((prev) => {
          if (!prev || !prev.columns) return prev;
          const updatedColumns = prev.columns.map((col) => {
            const cards = (col.cards || []).map((c) => {
              if (c.id === card_id) {
                const comments = (c.comments || []).filter((cm) => cm.id !== comment_id);
                return {
                  ...c,
                  comments_count: Math.max(0, (c.comments_count || 0) - 1),
                  comments,
                };
              }
              return c;
            });
            return { ...col, cards };
          });
          return { ...prev, columns: updatedColumns };
        });

        setSelectedCard((prev) => {
          if (prev && prev.id === card_id) {
            const comments = (prev.comments || []).filter((cm) => cm.id !== comment_id);
            return {
              ...prev,
              comments_count: Math.max(0, (prev.comments_count || 0) - 1),
              comments,
            };
          }
          return prev;
        });
      } else if (type === "columns:reordered") {
        const { order, reordered_by_user_id } = payload;
        if (reordered_by_user_id !== user?.id && order && Array.isArray(order)) {
          setBoard((prev) => {
            if (!prev || !prev.columns) return prev;
            const colMap = new Map(prev.columns.map((c) => [c.id, c]));
            const reordered = order
              .map((id: number, idx: number) => {
                const c = colMap.get(id);
                return c ? { ...c, position: idx } : null;
              })
              .filter(Boolean) as CyberboardColumn[];
            return { ...prev, columns: reordered };
          });
        }
      } else if (type === "column:created" || type === "column:updated" || type === "column:deleted") {
        loadBoard();
      }
    },
    [user?.id, loadBoard]
  );

  // Custom Realtime Hook
  const {
    boardContainerRef,
    isConnected,
    remoteCursors,
    remoteDraggingCards,
    boardPresenceUsers,
    activeDragCard,
    handlePointerMove,
    handlePointerLeave,
    handleBoardDragOver,
    handleCardDragStart,
    handleCardDragEnd,
    clearLocalDragState,
  } = useCyberboardRealtime({
    numericBoardId,
    userId: user?.id,
    onWsBoardEvent: handleWsBoardEvent,
  });

  // Actions
  const handleAddSuggestion = async (data: {
    column_id?: number;
    title: string;
    description?: string;
    activity_date?: string;
    activity_end_date?: string;
    priority?: "low" | "medium" | "high";
    color_tag?: string;
  }) => {
    if (!numericBoardId) return;
    const newCard = await createCyberboardCard(numericBoardId, data);
    setBoard((prev) => {
      if (!prev || !prev.columns) return prev;
      const updatedColumns = prev.columns.map((col) => {
        if (col.id === newCard.column_id) {
          const cards = col.cards || [];
          if (cards.some((c) => c.id === newCard.id)) return col;
          return { ...col, cards: [...cards, newCard] };
        }
        return col;
      });
      return { ...prev, columns: updatedColumns };
    });
  };

  const handleCardDrop = async (cardId: number, targetColId: number) => {
    clearLocalDragState(cardId);

    if (!board || !board.columns) return;

    let targetCard: CyberboardCard | null = null;
    let fromColId: number | null = null;

    for (const col of board.columns) {
      const found = (col.cards || []).find((c) => c.id === cardId);
      if (found) {
        targetCard = found;
        fromColId = col.id;
        break;
      }
    }

    if (!targetCard || fromColId === targetColId) return;

    const targetColumn = board.columns.find((c) => c.id === targetColId);

    if (targetColumn) {
      const isHost = board.created_by === user?.id;
      const isAdmin = user?.role === "admin" || user?.role === "superadmin";
      const allowedRoles = targetColumn.allowed_roles || [];
      const allowedUsers = targetColumn.allowed_users || [];
      const hasRestriction = allowedRoles.length > 0 || allowedUsers.length > 0;

      if (hasRestriction && !isHost && !isAdmin) {
        const roleAllowed = allowedRoles.includes(user?.role || "");
        const userAllowed = user?.id ? allowedUsers.includes(user.id) : false;
        if (!roleAllowed && !userAllowed) {
          showToast(
            `Permission Denied: You do not have permission to move cards into '${targetColumn.title}'.`,
            "error"
          );
          return;
        }
      }
    }

    const newPos = (targetColumn?.cards || []).length;

    // Optimistic state update
    setBoard((prev) => {
      if (!prev || !prev.columns) return prev;
      const updatedColumns = prev.columns.map((col) => {
        let cards = (col.cards || []).filter((c) => c.id !== cardId);
        if (col.id === targetColId) {
          cards = [...cards, { ...targetCard!, column_id: targetColId, position: newPos }];
        }
        return { ...col, cards };
      });
      return { ...prev, columns: updatedColumns };
    });

    try {
      await moveCyberboardCard(cardId, targetColId, newPos);
    } catch (err: any) {
      console.error("Failed to move card on server:", err);
      showToast(err.message || "Failed to move card.", "error");
      loadBoard();
    }
  };

  const handleVoteToggle = async (cardId: number) => {
    try {
      const res = await toggleCyberboardCardVote(cardId);
      setBoard((prev) => {
        if (!prev || !prev.columns) return prev;
        const updatedColumns = prev.columns.map((col) => {
          const cards = (col.cards || []).map((c) =>
            c.id === cardId
              ? { ...c, votes_count: res.votes_count, has_voted: res.has_voted }
              : c
          );
          return { ...col, cards };
        });
        return { ...prev, columns: updatedColumns };
      });

      setSelectedCard((prev) =>
        prev?.id === cardId
          ? { ...prev, votes_count: res.votes_count, has_voted: res.has_voted }
          : prev
      );
    } catch (err) {
      console.error("Failed to toggle vote:", err);
    }
  };

  const handleAddComment = async (cardId: number, content: string) => {
    const comment = await createCyberboardCardComment(cardId, content);
    setBoard((prev) => {
      if (!prev || !prev.columns) return prev;
      const updatedColumns = prev.columns.map((col) => {
        const cards = (col.cards || []).map((c) => {
          if (c.id === cardId) {
            const comments = c.comments || [];
            if (comments.some((cm) => cm.id === comment.id)) return c;
            return {
              ...c,
              comments_count: (c.comments_count || 0) + 1,
              comments: [...comments, comment],
            };
          }
          return c;
        });
        return { ...col, cards };
      });
      return { ...prev, columns: updatedColumns };
    });

    setSelectedCard((prev) => {
      if (prev?.id === cardId) {
        const comments = prev.comments || [];
        if (comments.some((cm) => cm.id === comment.id)) return prev;
        return {
          ...prev,
          comments_count: (prev.comments_count || 0) + 1,
          comments: [...comments, comment],
        };
      }
      return prev;
    });
  };

  const handleDeleteComment = async (cardId: number, commentId: number) => {
    await deleteCyberboardCardComment(commentId);
    setBoard((prev) => {
      if (!prev || !prev.columns) return prev;
      const updatedColumns = prev.columns.map((col) => {
        const cards = (col.cards || []).map((c) => {
          if (c.id === cardId) {
            const comments = (c.comments || []).filter((cm) => cm.id !== commentId);
            return {
              ...c,
              comments_count: Math.max(0, (c.comments_count || 0) - 1),
              comments,
            };
          }
          return c;
        });
        return { ...col, cards };
      });
      return { ...prev, columns: updatedColumns };
    });

    setSelectedCard((prev) => {
      if (prev?.id === cardId) {
        const comments = (prev.comments || []).filter((cm) => cm.id !== commentId);
        return {
          ...prev,
          comments_count: Math.max(0, (prev.comments_count || 0) - 1),
          comments,
        };
      }
      return prev;
    });
  };

  const handleDeleteCard = (cardId: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setConfirmModal({
      isOpen: true,
      title: "Delete Activity Card?",
      message: "Are you sure you want to delete this activity card? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await deleteCyberboardCard(cardId);
          setBoard((prev) => {
            if (!prev || !prev.columns) return prev;
            const updatedColumns = prev.columns.map((col) => ({
              ...col,
              cards: (col.cards || []).filter((c) => c.id !== cardId),
            }));
            return { ...prev, columns: updatedColumns };
          });
          if (selectedCard?.id === cardId) {
            setSelectedCard(null);
          }
          showToast("Card deleted successfully.", "success");
        } catch (err: any) {
          showToast(err.message || "Failed to delete card.", "error");
        }
      },
    });
  };

  const handleUpdateCard = async (cardId: number, data: Partial<CyberboardCard>) => {
    try {
      const updatedCard = await updateCyberboardCard(cardId, data);
      setBoard((prev) => {
        if (!prev || !prev.columns) return prev;
        const updatedColumns = prev.columns.map((col) => {
          const cards = (col.cards || []).map((c) => (c.id === cardId ? { ...c, ...updatedCard } : c));
          return { ...col, cards };
        });
        return { ...prev, columns: updatedColumns };
      });
      setSelectedCard((prev) => (prev?.id === cardId ? { ...prev, ...updatedCard } : prev));
      showToast("Card updated successfully.", "success");
    } catch (err: any) {
      console.error("Failed to update card:", err);
      showToast(err.message || "Failed to update card.", "error");
      throw err;
    }
  };

  const handleSaveBoardSettings = async (updatedData: Partial<CyberboardBoard>) => {
    if (!board) return;
    try {
      const updatedBoard = await updateCyberboardBoard(board.id, updatedData);
      setBoard((prev) => (prev ? { ...prev, ...updatedBoard } : updatedBoard));
      showToast("Board settings saved successfully.", "success");
    } catch (err: any) {
      console.error("Failed to save board settings:", err);
      showToast(err.message || "Failed to save board settings.", "error");
      throw err;
    }
  };

  const handleDeleteBoard = (boardIdToDelete: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete CyberBoard?",
      message: "Are you sure you want to delete this board and all its columns and cards? This action is permanent.",
      onConfirm: async () => {
        try {
          await deleteCyberboardBoard(boardIdToDelete);
          showToast("Board deleted successfully.", "success");
          window.location.href = "/app/cyberboard";
        } catch (err: any) {
          showToast(err.message || "Failed to delete board.", "error");
        }
      },
    });
  };

  const handleAddColumn = async (data: {
    title: string;
    color?: string;
    allowed_roles?: string[] | null;
    allowed_users?: number[] | null;
  }) => {
    if (!numericBoardId) return;
    const newCol = await createCyberboardColumn(numericBoardId, data);
    setBoard((prev) => {
      if (!prev) return prev;
      const cols = prev.columns || [];
      return { ...prev, columns: [...cols, newCol] };
    });
    showToast("New column created!", "success");
  };

  const handleUpdateColumnPermissions = async (
    columnId: number,
    data: {
      title?: string;
      color?: string;
      allowed_roles?: string[] | null;
      allowed_users?: number[] | null;
    }
  ) => {
    const updatedCol = await updateCyberboardColumn(columnId, data);
    setBoard((prev) => {
      if (!prev || !prev.columns) return prev;
      const columns = prev.columns.map((col) => (col.id === columnId ? { ...col, ...updatedCol } : col));
      return { ...prev, columns };
    });
    showToast("Column settings updated!", "success");
  };

  const handleColumnDrop = async (
    draggedColId: number,
    targetColId: number,
    positionDirection?: "before" | "after"
  ) => {
    if (!board || !board.columns || !numericBoardId) return;

    const isHost = board.created_by === user?.id;
    const isAdmin = user?.role === "admin" || user?.role === "superadmin";

    if (!isHost && !isAdmin) {
      showToast("Only board hosts or admins can reorder columns.", "error");
      return;
    }

    const currentCols = [...board.columns];
    const draggedIdx = currentCols.findIndex((c) => c.id === draggedColId);
    if (draggedIdx === -1) return;

    const [movedCol] = currentCols.splice(draggedIdx, 1);
    let targetIdx = currentCols.findIndex((c) => c.id === targetColId);
    if (targetIdx === -1) return;

    const insertIdx = positionDirection === "after" ? targetIdx + 1 : targetIdx;
    currentCols.splice(insertIdx, 0, movedCol);

    const reorderedCols = currentCols.map((col, idx) => ({ ...col, position: idx }));

    // Optimistic update
    setBoard((prev) => (prev ? { ...prev, columns: reorderedCols } : prev));

    try {
      const orderIds = reorderedCols.map((c) => c.id);
      await reorderCyberboardColumns(numericBoardId, orderIds);
    } catch (err: any) {
      console.error("Failed to reorder columns:", err);
      showToast(err.message || "Failed to reorder columns.", "error");
      loadBoard();
    }
  };

  const handleDeleteColumn = (columnId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Kanban Column?",
      message: "Are you sure you want to delete this column? All cards in this column will be permanently removed.",
      onConfirm: async () => {
        try {
          await deleteCyberboardColumn(columnId);
          setBoard((prev) => {
            if (!prev || !prev.columns) return prev;
            return {
              ...prev,
              columns: prev.columns.filter((col) => col.id !== columnId),
            };
          });
          showToast("Column deleted.", "success");
        } catch (err: any) {
          showToast(err.message || "Failed to delete column.", "error");
        }
      },
    });
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-text-muted">Loading CyberBoard activity planner...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center text-error mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-text-primary">Failed to load board</h2>
        <p className="text-xs text-text-muted">{error || "Board not found."}</p>
        <Link
          to="/app/cyberboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-surface-950 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Boards
        </Link>
      </div>
    );
  }

  const columns = board.columns || [];
  const totalCardsCount = columns.reduce((acc, col) => acc + (col.cards?.length || 0), 0);
  const isHost = board ? board.created_by === user?.id : false;
  const canManageBoard = isHost || isAdmin;

  const canCreateColumn = (() => {
    if (!board || !user) return false;
    if (isAdmin || isHost) return true;
    const policy = board.column_creation_policy || "everyone";
    if (policy === "host_admin_only") return false;
    if (policy === "specific_roles") {
      const allowedRoles = board.allowed_column_creator_roles || [];
      return user.role ? allowedRoles.includes(user.role) : false;
    }
    if (policy === "specific_users") {
      const allowedUsers = board.allowed_column_creator_users || [];
      return allowedUsers.includes(user.id);
    }
    return true;
  })();

  const selectedCardColumn = selectedCard
    ? columns.find((c) => c.id === selectedCard.column_id)
    : null;

  // Compute active collaborators list (Self + Remote board presence users)
  const activeCollaboratorsList = [
    ...(user
      ? [
          {
            id: user.id,
            name: user.name || "You",
            avatar: user.avatar,
            role: user.role,
            isMe: true,
            status: activeDragCard
              ? `Dragging "${activeDragCard.title}"`
              : "Active (You)",
          },
        ]
      : []),
    ...Object.values(boardPresenceUsers).map((pUser) => {
      const isDragging = remoteDraggingCards[pUser.id];
      return {
        id: pUser.id,
        name: pUser.name,
        avatar: pUser.avatar,
        role: "Member",
        isMe: false,
        status: isDragging ? `Dragging "${isDragging.title}"` : pUser.status || "Viewing board",
      };
    }),
  ];

  if (error && error.toLowerCase().includes("private")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-6 text-center bg-surface-950 space-y-4">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-lg">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Private Board Access Denied</h2>
        <p className="text-xs text-text-muted max-w-md leading-relaxed">
          This board is private. You need an invitation from the board host to view or participate in this board.
        </p>
        <Link
          to="/app/cyberboard"
          className="px-5 py-2.5 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all shadow-md shadow-primary/20"
        >
          Back to All Boards
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={boardContainerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative flex flex-col h-full min-h-0 overflow-hidden bg-surface-950 select-none"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage.text}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Mobile Experience Notice Banner */}
      <MobileNoticeBanner />

      {/* Live Remote Cursors & Drag Ghosts Overlay */}
      <LiveCursorsOverlay
        remoteCursors={remoteCursors}
        remoteDraggingCards={remoteDraggingCards}
      />

      {/* Board Navigation Header */}
      <BoardHeader
        board={board}
        totalCardsCount={totalCardsCount}
        isConnected={isConnected}
        activeCollaboratorsCount={activeCollaboratorsList.length}
        showCollaborators={showCollaborators}
        copiedLink={copiedLink}
        canManageBoard={canManageBoard}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onToggleCollaborators={() => setShowCollaborators((prev) => !prev)}
        onCopyShareLink={handleCopyShareLink}
        onSuggestActivityClick={() => {
          setTargetColumnId(columns[0]?.id);
          setShowNewSuggestionModal(true);
        }}
        onOpenSettings={() => setShowBoardSettingsModal(true)}
        onOpenBoardAuditLog={() => setShowBoardAuditLog(true)}
      />

      {/* Workspace Flex Area (Board Columns + Active Collaborators Sidebar OR Gantt Roadmap View) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {viewMode === "gantt" ? (
          <div className="flex-1 p-3 sm:p-5 h-full overflow-hidden">
            <GanttRoadmapView
              board={board}
              columns={columns}
              cards={columns.flatMap((col) => col.cards || [])}
              canManageBoard={canManageBoard}
              onSelectCard={(card) => setSelectedCard(card)}
              onUpdateCardDate={async (cardId, activityDate, activityEndDate) => {
                await handleUpdateCard(cardId, {
                  activity_date: activityDate,
                  activity_end_date: activityEndDate,
                });
              }}
              onAddNewCard={(colId) => {
                setTargetColumnId(colId || columns[0]?.id);
                setShowNewSuggestionModal(true);
              }}
            />
          </div>
        ) : (
          /* Main Kanban Columns Workspace (Horizontal Scroll) */
          <div
            onDragOver={handleBoardDragOver}
            className="flex-1 overflow-x-auto p-4 sm:p-6 flex items-start gap-4 h-full"
          >
            {columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                boardType={board.type}
                currentUserId={user?.id}
                userRole={user?.role}
                boardHostId={board.created_by}
                isAdmin={isAdmin}
                onCardClick={(card) => setSelectedCard(card)}
                onVoteToggle={(cardId) => handleVoteToggle(cardId)}
                onDeleteCard={(cardId) => handleDeleteCard(cardId)}
                onAddSuggestionClick={(colId) => {
                  setTargetColumnId(colId);
                  setShowNewSuggestionModal(true);
                }}
                onCardDrop={handleCardDrop}
                onColumnDrop={handleColumnDrop}
                onDeleteColumn={handleDeleteColumn}
                onConfigureColumnClick={(col) => setSelectedColumnToConfigure(col)}
                onShowToast={(msg) => showToast(msg, "error")}
                onCardDragStart={handleCardDragStart}
                onCardDragEnd={handleCardDragEnd}
              />
            ))}

            {/* Add Column Button */}
            {canCreateColumn && (
              <div className="w-72 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(true)}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/60 text-text-muted hover:text-primary hover:bg-primary/5 transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Column</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active Collaborators Right Sidebar */}
        {showCollaborators && (
          <CollaboratorsSidebar
            board={board}
            collaborators={activeCollaboratorsList}
            onClose={() => setShowCollaborators(false)}
          />
        )}
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          boardType={board.type}
          currentUserId={user?.id}
          userRole={user?.role}
          boardHostId={board.created_by}
          columnPermissions={
            selectedCardColumn
              ? {
                  allowed_roles: selectedCardColumn.allowed_roles,
                  allowed_users: selectedCardColumn.allowed_users,
                }
              : undefined
          }
          isAdmin={isAdmin}
          onClose={() => setSelectedCard(null)}
          onVoteToggle={handleVoteToggle}
          onAddComment={handleAddComment}
          onDeleteComment={(commentId) => handleDeleteComment(selectedCard.id, commentId)}
          onDeleteCard={handleDeleteCard}
          onUpdateCard={handleUpdateCard}
        />
      )}

      {/* New Suggestion Modal */}
      {showNewSuggestionModal && (
        <NewSuggestionModal
          boardId={board.id}
          columns={columns}
          boardType={board.type}
          defaultColumnId={targetColumnId}
          currentUserId={user?.id}
          userRole={user?.role}
          boardHostId={board.created_by}
          isAdmin={isAdmin}
          onClose={() => setShowNewSuggestionModal(false)}
          onSubmit={handleAddSuggestion}
        />
      )}

      {/* Board Settings Modal */}
      {showBoardSettingsModal && board && (
        <BoardSettingsModal
          board={board}
          currentUserId={user?.id}
          isAdmin={isAdmin}
          onClose={() => setShowBoardSettingsModal(false)}
          onSave={handleSaveBoardSettings}
          onDeleteBoard={isHost || isAdmin ? handleDeleteBoard : undefined}
        />
      )}

      {/* Board-Level Audit Log Sidepanel Drawer */}
      {showBoardAuditLog && board && (
        <BoardAuditLogDrawer
          boardId={board.id}
          boardTitle={board.title}
          onClose={() => setShowBoardAuditLog(false)}
          onSelectCard={(cardId) => {
            const foundCard = (board.columns || [])
              .flatMap((col) => col.cards || [])
              .find((c) => c.id === cardId);
            if (foundCard) {
              setSelectedCard(foundCard);
            }
          }}
        />
      )}

      {/* Add Column Modal (Admin/Host/Permitted) */}
      {showAddColumnModal && (
        <AddColumnModal
          collaboratorsList={activeCollaboratorsList}
          onClose={() => setShowAddColumnModal(false)}
          onSubmit={handleAddColumn}
        />
      )}

      {/* Configure Column Permissions Modal */}
      {selectedColumnToConfigure && (
        <ConfigureColumnModal
          column={selectedColumnToConfigure}
          collaboratorsList={activeCollaboratorsList}
          onClose={() => setSelectedColumnToConfigure(null)}
          onSubmit={handleUpdateColumnPermissions}
        />
      )}

      {/* Reusable Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
}
