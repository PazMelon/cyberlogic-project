import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Plus, AlertCircle } from "lucide-react";
import {
  fetchCyberboardBoard,
  createCyberboardCard,
  deleteCyberboardCard,
  moveCyberboardCard,
  toggleCyberboardCardVote,
  createCyberboardCardComment,
  deleteCyberboardCardComment,
  createCyberboardColumn,
  deleteCyberboardColumn,
  type CyberboardBoard,
  type CyberboardCard,
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useCyberboardRealtime } from "../hooks/useCyberboardRealtime";
import BoardHeader from "../components/cyberboard/BoardHeader";
import BoardColumn from "../components/cyberboard/BoardColumn";
import CollaboratorsSidebar from "../components/cyberboard/CollaboratorsSidebar";
import LiveCursorsOverlay from "../components/cyberboard/LiveCursorsOverlay";
import MobileNoticeBanner from "../components/cyberboard/MobileNoticeBanner";
import CardDetailModal from "../components/cyberboard/CardDetailModal";
import NewSuggestionModal from "../components/cyberboard/NewSuggestionModal";
import AddColumnModal from "../components/cyberboard/AddColumnModal";

export default function CyberBoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const numericBoardId = boardId ? parseInt(boardId, 10) : null;

  const { user, isAdmin } = useAuth();

  const [board, setBoard] = useState<CyberboardBoard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedCard, setSelectedCard] = useState<CyberboardCard | null>(null);
  const [showNewSuggestionModal, setShowNewSuggestionModal] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<number | undefined>(undefined);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(true);

  // Load board data
  const loadBoard = useCallback(async () => {
    if (!numericBoardId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCyberboardBoard(numericBoardId);
      setBoard(data);
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
        const { card_id, to_column_id, position } = payload;
        setBoard((prev) => {
          if (!prev || !prev.columns) return prev;

          let targetCard: CyberboardCard | null = null;
          for (const col of prev.columns) {
            const found = (col.cards || []).find((c) => c.id === card_id);
            if (found) {
              targetCard = { ...found, column_id: to_column_id, position };
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
      } else if (type === "card:voted") {
        const { card_id, votes_count, voted_by_user_id, has_voted } = payload;
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
      } else if (type === "column:created" || type === "column:deleted") {
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
    } catch (err) {
      console.error("Failed to move card on server:", err);
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

  const handleDeleteCard = async (cardId: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!window.confirm("Are you sure you want to delete this activity card?")) return;

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
    } catch (err: any) {
      alert(err.message || "Failed to delete card.");
    }
  };

  const handleAddColumn = async (title: string) => {
    if (!numericBoardId) return;
    const newCol = await createCyberboardColumn(numericBoardId, { title });
    setBoard((prev) => {
      if (!prev) return prev;
      const cols = prev.columns || [];
      return { ...prev, columns: [...cols, newCol] };
    });
  };

  const handleDeleteColumn = async (columnId: number) => {
    if (!window.confirm("Are you sure you want to delete this column and all cards in it?")) {
      return;
    }
    try {
      await deleteCyberboardColumn(columnId);
      setBoard((prev) => {
        if (!prev || !prev.columns) return prev;
        return {
          ...prev,
          columns: prev.columns.filter((col) => col.id !== columnId),
        };
      });
    } catch (err: any) {
      alert(err.message || "Failed to delete column.");
    }
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

  // Compute active collaborators list (Self + Remote cursors/draggers)
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
    ...Object.entries(remoteCursors).map(([idStr, c]) => {
      const uid = Number(idStr);
      const isDragging = remoteDraggingCards[uid];
      return {
        id: uid,
        name: c.name,
        avatar: c.avatar,
        role: "Member",
        isMe: false,
        status: isDragging ? `Dragging "${isDragging.title}"` : "Active on board",
      };
    }),
  ];

  return (
    <div
      ref={boardContainerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative flex flex-col h-full min-h-0 overflow-hidden bg-surface-950 select-none"
    >
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
        onToggleCollaborators={() => setShowCollaborators((prev) => !prev)}
        onCopyShareLink={handleCopyShareLink}
        onSuggestActivityClick={() => {
          setTargetColumnId(columns[0]?.id);
          setShowNewSuggestionModal(true);
        }}
      />

      {/* Workspace Flex Area (Board Columns + Active Collaborators Sidebar) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Main Kanban Columns Workspace (Horizontal Scroll) */}
        <div
          onDragOver={handleBoardDragOver}
          className="flex-1 overflow-x-auto p-4 sm:p-6 flex items-start gap-4 h-full"
        >
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              onCardClick={(card) => setSelectedCard(card)}
              onVoteToggle={(cardId) => handleVoteToggle(cardId)}
              onDeleteCard={(cardId) => handleDeleteCard(cardId)}
              onAddSuggestionClick={(colId) => {
                setTargetColumnId(colId);
                setShowNewSuggestionModal(true);
              }}
              onCardDrop={handleCardDrop}
              onDeleteColumn={handleDeleteColumn}
              onCardDragStart={handleCardDragStart}
              onCardDragEnd={handleCardDragEnd}
            />
          ))}

          {/* Add Column Button (Admin) */}
          {isAdmin && (
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
          currentUserId={user?.id}
          isAdmin={isAdmin}
          onClose={() => setSelectedCard(null)}
          onVoteToggle={handleVoteToggle}
          onAddComment={handleAddComment}
          onDeleteComment={(commentId) => handleDeleteComment(selectedCard.id, commentId)}
          onDeleteCard={handleDeleteCard}
        />
      )}

      {/* New Suggestion Modal */}
      {showNewSuggestionModal && (
        <NewSuggestionModal
          boardId={board.id}
          columns={columns}
          defaultColumnId={targetColumnId}
          onClose={() => setShowNewSuggestionModal(false)}
          onSubmit={handleAddSuggestion}
        />
      )}

      {/* Add Column Modal (Admin) */}
      {showAddColumnModal && (
        <AddColumnModal
          onClose={() => setShowAddColumnModal(false)}
          onSubmit={handleAddColumn}
        />
      )}
    </div>
  );
}
