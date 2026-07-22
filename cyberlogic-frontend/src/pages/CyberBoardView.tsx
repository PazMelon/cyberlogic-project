import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router";
import {
  ArrowLeft,
  Plus,
  Radio,
  Share2,
  AlertCircle,
  MousePointer,
  Smartphone,
  Users,
  X,
  ShieldCheck,
} from "lucide-react";
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
import { useWebSocket } from "../context/WebSocketContext";
import BoardColumn from "../components/cyberboard/BoardColumn";
import CardDetailModal from "../components/cyberboard/CardDetailModal";
import NewSuggestionModal from "../components/cyberboard/NewSuggestionModal";

export default function CyberBoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const numericBoardId = boardId ? parseInt(boardId, 10) : null;

  const { user, isAdmin } = useAuth();
  const { subscribe, isConnected, sendMessage } = useWebSocket();

  const [board, setBoard] = useState<CyberboardBoard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live real-time collaboration states: remote cursors & dragging cards
  const [remoteCursors, setRemoteCursors] = useState<
    Record<number, { x: number; y: number; name: string; avatar: string; updatedAt: number }>
  >({});
  const [remoteDraggingCards, setRemoteDraggingCards] = useState<
    Record<
      number,
      { cardId: number; title: string; x: number; y: number; name: string; avatar: string }
    >
  >({});

  const boardContainerRef = useRef<HTMLDivElement | null>(null);
  const lastMoveSentRef = useRef<number>(0);
  const lastSentPosRef = useRef<{ x: number; y: number } | null>(null);
  const activeDragCardRef = useRef<CyberboardCard | null>(null);

  // Modals state
  const [selectedCard, setSelectedCard] = useState<CyberboardCard | null>(null);
  const [showNewSuggestionModal, setShowNewSuggestionModal] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<number | undefined>(undefined);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
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

  // Real-time WebSocket event handler
  const handleWsEvent = useCallback(
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

        // Clean up any remote dragging indicator for this card
        setRemoteDraggingCards((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((uidStr) => {
            const uid = Number(uidStr);
            if (next[uid]?.cardId === card_id) {
              delete next[uid];
            }
          });
          return next;
        });

        setBoard((prev) => {
          if (!prev || !prev.columns) return prev;

          let targetCard: CyberboardCard | null = null;

          // Find card from state
          for (const col of prev.columns) {
            const found = (col.cards || []).find((c) => c.id === card_id);
            if (found) {
              targetCard = { ...found, column_id: to_column_id, position };
              break;
            }
          }

          if (!targetCard) return prev;

          const updatedColumns = prev.columns.map((col) => {
            // Remove from source column
            let cards = (col.cards || []).filter((c) => c.id !== card_id);

            // Add to target column
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
      } else if (type === "cursor_move") {
        const { user_id, user_name, user_avatar, x, y } = payload;
        if (user_id !== user?.id) {
          setRemoteCursors((prev) => ({
            ...prev,
            [user_id]: { x, y, name: user_name, avatar: user_avatar, updatedAt: Date.now() },
          }));
        }
      } else if (type === "card_drag") {
        const { user_id, user_name, user_avatar, cardId, title, x, y } = payload;
        if (user_id !== user?.id) {
          setRemoteDraggingCards((prev) => ({
            ...prev,
            [user_id]: { cardId, title, x, y, name: user_name, avatar: user_avatar },
          }));
        }
      } else if (type === "card_drag_end") {
        const { user_id } = payload;
        setRemoteDraggingCards((prev) => {
          const next = { ...prev };
          delete next[user_id];
          return next;
        });
      } else if (type === "cursor_leave") {
        const { user_id } = payload;
        setRemoteCursors((prev) => {
          const next = { ...prev };
          delete next[user_id];
          return next;
        });
        setRemoteDraggingCards((prev) => {
          const next = { ...prev };
          delete next[user_id];
          return next;
        });
      }
    },
    [user?.id, loadBoard]
  );

  // Send live pointer position to channel (throttled ~40ms & 6px movement radius threshold)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!numericBoardId || !boardContainerRef.current) return;
    const now = Date.now();
    if (now - lastMoveSentRef.current < 40) return;

    const rect = boardContainerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    // 100px movement radius deadzone threshold: only transmit when cursor moves >= 100px
    if (lastSentPosRef.current) {
      const dx = x - lastSentPosRef.current.x;
      const dy = y - lastSentPosRef.current.y;
      if (dx * dx + dy * dy < 2000) return;
    }

    lastMoveSentRef.current = now;
    lastSentPosRef.current = { x, y };

    if (activeDragCardRef.current) {
      sendMessage("card_drag", `cyberboard:${numericBoardId}`, {
        cardId: activeDragCardRef.current.id,
        title: activeDragCardRef.current.title,
        x,
        y,
      });
    } else {
      sendMessage("cursor_move", `cyberboard:${numericBoardId}`, { x, y });
    }
  };

  const handlePointerLeave = () => {
    lastSentPosRef.current = null;
    if (numericBoardId) {
      sendMessage("cursor_leave", `cyberboard:${numericBoardId}`, {});
    }
  };

  const handleBoardDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!numericBoardId || !boardContainerRef.current) return;
    const now = Date.now();
    if (now - lastMoveSentRef.current < 40) return;

    const rect = boardContainerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    // 100px movement radius deadzone threshold
    if (lastSentPosRef.current) {
      const dx = x - lastSentPosRef.current.x;
      const dy = y - lastSentPosRef.current.y;
      if (dx * dx + dy * dy < 10000) return;
    }

    lastMoveSentRef.current = now;
    lastSentPosRef.current = { x, y };

    if (activeDragCardRef.current) {
      sendMessage("card_drag", `cyberboard:${numericBoardId}`, {
        cardId: activeDragCardRef.current.id,
        title: activeDragCardRef.current.title,
        x,
        y,
      });
    }
  };

  const handleCardDragStart = (_e: React.DragEvent, card: CyberboardCard) => {
    activeDragCardRef.current = card;
  };

  const handleCardDragEnd = (_e: React.DragEvent, card: CyberboardCard) => {
    activeDragCardRef.current = null;
    if (numericBoardId) {
      sendMessage("card_drag_end", `cyberboard:${numericBoardId}`, { cardId: card.id });
    }
  };

  // Window visibility & tab blur listener: immediately remove cursor when user switches tabs or leaves
  useEffect(() => {
    if (!numericBoardId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendMessage("cursor_leave", `cyberboard:${numericBoardId}`, {});
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleVisibilityChange);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleVisibilityChange);
      sendMessage("cursor_leave", `cyberboard:${numericBoardId}`, {});
    };
  }, [numericBoardId, sendMessage]);

  // Interval cleanup to prune stale remote cursors (older than 2.5s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors((prev) => {
        let changed = false;
        const next: typeof prev = {};
        Object.entries(prev).forEach(([uidStr, cursor]) => {
          if (now - cursor.updatedAt < 2500) {
            next[Number(uidStr)] = cursor;
          } else {
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to board channel
  useEffect(() => {
    if (!numericBoardId) return;
    const unsubscribe = subscribe(`cyberboard:${numericBoardId}`, handleWsEvent);
    return () => {
      unsubscribe();
    };
  }, [numericBoardId, subscribe, handleWsEvent]);

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
    // Immediately clear active drag reference & send drag end event to WebSocket
    activeDragCardRef.current = null;
    if (numericBoardId) {
      sendMessage("card_drag_end", `cyberboard:${numericBoardId}`, { cardId });
    }

    if (!board || !board.columns) return;

    // Optimistic UI update
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
      loadBoard(); // Revert on failure
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

  const handleDeleteComment = async (commentId: number) => {
    await deleteCyberboardCardComment(commentId);
    if (selectedCard) {
      const updatedComments = (selectedCard.comments || []).filter((c) => c.id !== commentId);
      setSelectedCard({
        ...selectedCard,
        comments_count: Math.max(0, (selectedCard.comments_count || 0) - 1),
        comments: updatedComments,
      });
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!window.confirm("Are you sure you want to delete this card?")) return;
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
      setSelectedCard(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete card.");
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericBoardId || !newColumnTitle.trim()) return;

    try {
      await createCyberboardColumn(numericBoardId, { title: newColumnTitle.trim() });
      setNewColumnTitle("");
      setShowAddColumnModal(false);
      loadBoard();
    } catch (err: any) {
      alert(err.message || "Failed to add column.");
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    if (!window.confirm("Are you sure? Cards inside will be moved to the first column.")) return;
    try {
      await deleteCyberboardColumn(columnId);
      loadBoard();
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

  // Compute active collaborators (Self + Remote cursors/draggers)
  const activeCollaboratorsList = [
    ...(user
      ? [
          {
            id: user.id,
            name: user.name || "You",
            avatar: user.avatar,
            role: user.role,
            isMe: true,
            status: activeDragCardRef.current
              ? `Dragging "${activeDragCardRef.current.title}"`
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
      <div className="md:hidden bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-between gap-2 flex-shrink-0 z-20">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Mobile Notice:</strong> Drag-and-drop planning is optimized for desktop screens. Tap any card to view details or add comments!
          </span>
        </div>
      </div>

      {/* Live Remote Cursors Overlay */}
      {Object.entries(remoteCursors).map(([idStr, cursor]) => (
        <div
          key={`cursor-${idStr}`}
          className="pointer-events-none absolute top-0 left-0 z-50 flex items-start gap-1 font-sans will-change-transform"
          style={{
            transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
            transition: "transform 60ms linear",
          }}
        >
          <MousePointer className="w-5 h-5 text-primary fill-primary drop-shadow-md -rotate-45" />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-900/90 border border-primary/40 shadow-xl text-[10px] font-bold text-text-primary backdrop-blur-xs">
            <img
              src={cursor.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user"}
              alt={cursor.name}
              className="w-3.5 h-3.5 rounded-full border border-primary object-cover"
            />
            <span>{cursor.name}</span>
          </div>
        </div>
      ))}

      {/* Live Remote Dragging Cards Ghost Overlay */}
      {Object.entries(remoteDraggingCards).map(([idStr, cardDrag]) => (
        <div
          key={`drag-${idStr}`}
          className="pointer-events-none absolute top-0 left-0 z-50 p-3 rounded-xl bg-primary/20 border-2 border-primary border-dashed shadow-2xl backdrop-blur-md max-w-xs space-y-1.5 scale-105 will-change-transform"
          style={{
            transform: `translate3d(${cardDrag.x + 15}px, ${cardDrag.y + 15}px, 0)`,
            transition: "transform 60ms linear",
          }}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
            <img
              src={cardDrag.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=user"}
              alt={cardDrag.name}
              className="w-4 h-4 rounded-full border border-primary object-cover"
            />
            <span>{cardDrag.name} is dragging...</span>
          </div>
          <p className="text-xs font-semibold text-text-primary line-clamp-1">
            {cardDrag.title}
          </p>
        </div>
      ))}

      {/* Board Navigation Header (Docked directly below Topbar) */}
      <div className="bg-surface-900/95 backdrop-blur-md border-b border-border/80 p-3.5 sm:px-6 flex items-center justify-between gap-4 flex-shrink-0 sticky top-0 z-10 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/app/cyberboard"
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-800 transition-all flex-shrink-0"
            title="Back to All Boards"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-text-primary truncate">
                {board.title}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-surface-800 text-text-secondary text-[10px] font-bold border border-border">
                {totalCardsCount} cards
              </span>
              {isConnected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  <Radio className="w-3 h-3 animate-pulse" /> Live Collab
                </span>
              )}
            </div>

            {board.description && (
              <p className="text-xs text-text-muted truncate max-w-xl">
                {board.description}
              </p>
            )}
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowCollaborators((prev) => !prev)}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showCollaborators
                ? "bg-primary/20 border-primary/40 text-primary shadow-xs"
                : "border-border text-text-muted hover:text-text-primary hover:bg-surface-800"
            }`}
            title="Toggle Active Collaborators Panel"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Collaborators</span>
            <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold border border-primary/30">
              {activeCollaboratorsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopyShareLink}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-surface-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Share Board Link"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{copiedLink ? "Link Copied!" : "Share"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTargetColumnId(columns[0]?.id);
              setShowNewSuggestionModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-primary text-surface-950 text-xs font-bold hover:bg-primary-light transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Suggest Activity</span>
          </button>
        </div>
      </div>

      {/* Workspace Flex Area (Board Columns + Active Collaborators Right Sidebar) */}
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
          <aside className="w-72 border-l border-border/70 bg-surface-900/95 backdrop-blur-md flex flex-col flex-shrink-0 z-20 h-full overflow-hidden transition-all animate-in slide-in-from-right duration-200">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border/60 flex items-center justify-between gap-2 bg-surface-950/40">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-text-primary">
                  Collaborators ({activeCollaboratorsList.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCollaborators(false)}
                className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-800 transition-all cursor-pointer"
                title="Close Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Live Online Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <span>Live Online ({activeCollaboratorsList.length})</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>

                <div className="space-y-2">
                  {activeCollaboratorsList.map((collab) => (
                    <div
                      key={collab.id}
                      className="p-2.5 rounded-xl bg-surface-800/60 border border-border/50 flex items-center gap-2.5 transition-all hover:bg-surface-800"
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={
                            collab.avatar ||
                            "https://api.dicebear.com/9.x/avataaars/svg?seed=user"
                          }
                          alt={collab.name}
                          className="w-8 h-8 rounded-full border border-border object-cover"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-surface-900" />
                      </div>

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-text-primary truncate">
                            {collab.name}
                          </span>
                          {collab.isMe && (
                            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-text-muted truncate">
                          {collab.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Board Creator Section */}
              {board.creator && (
                <div className="space-y-2.5 pt-4 border-t border-border/50">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                    Board Host
                  </span>
                  <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2.5">
                    <img
                      src={
                        board.creator.avatar ||
                        "https://api.dicebear.com/9.x/avataaars/svg?seed=creator"
                      }
                      alt={board.creator.name}
                      className="w-8 h-8 rounded-full border border-primary/40 object-cover"
                    />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-text-primary truncate">
                          {board.creator.name}
                        </span>
                        <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      </div>
                      <p className="text-[10px] text-primary/80 font-medium">
                        Board Host
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
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
          onDeleteComment={handleDeleteComment}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-900 border border-border rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-text-primary">Add New Column</h3>
            <form onSubmit={handleAddColumn} className="space-y-4">
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Column title (e.g. Planning)"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-border text-sm text-text-primary focus:outline-none focus:border-primary"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:bg-surface-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-surface-950 text-xs font-bold"
                >
                  Add Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
