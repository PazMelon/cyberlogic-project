import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router";
import { ArrowLeft, Plus, AlertCircle, Kanban } from "lucide-react";
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
  fetchDirectory,
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
import BoardControlsSidebar from "../components/cyberboard/BoardControlsSidebar";
import BoardMediaVaultModal from "../components/cyberboard/BoardMediaVaultModal";
import CyberboardChatSidebar from "../components/cyberboard/CyberboardChatSidebar";
import ConfirmModal from "../components/cyberboard/ConfirmModal";
import PrivateBoardAccessScreen from "../components/cyberboard/PrivateBoardAccessScreen";
import BoardJoinRequestsPanel from "../components/cyberboard/BoardJoinRequestsPanel";
import { exportBoardToExcel } from "../utils/exportBoardToExcel";
import {
  getAvatarUrl,
  generateCyberboardInviteLink,
  fetchCyberboardJoinRequests,
  type CyberboardChatMessage,
} from "../utils/api";

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
  const [showMediaVaultModal, setShowMediaVaultModal] = useState(false);
  const [wasMediaVaultOpenBeforeCard, setWasMediaVaultOpenBeforeCard] = useState(false);
  const [privateBoardError, setPrivateBoardError] = useState<{
    board_id: number;
    board_title?: string;
    host_name?: string;
    has_pending_request?: boolean;
  } | null>(null);
  const [showJoinRequestsPanel, setShowJoinRequestsPanel] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [selectedColumnToConfigure, setSelectedColumnToConfigure] = useState<CyberboardColumn | null>(null);
  const [directoryMembers, setDirectoryMembers] = useState<any[]>([]);
  const [initialNewCardData, setInitialNewCardData] = useState<{
    phase?: string;
    activity_date?: string;
    activity_end_date?: string;
    is_milestone?: boolean;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchDirectory()
      .then((data) => {
        if (isMounted && data) setDirectoryMembers(data);
      })
      .catch((err) => console.error("Failed to load directory members:", err));
    return () => {
      isMounted = false;
    };
  }, []);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showControlsSidebar, setShowControlsSidebar] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const chatParam = searchParams.get("chat");
  const [showChatSidebar, setShowChatSidebar] = useState(chatParam === "true");
  const showChatSidebarRef = useRef(showChatSidebar);
  useEffect(() => {
    showChatSidebarRef.current = showChatSidebar;
    if (showChatSidebar) {
      setHasUnreadChat(false);
      setUnreadChatCount(0);
    }
  }, [showChatSidebar]);

  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [realtimeChatMessage, setRealtimeChatMessage] = useState<CyberboardChatMessage | null>(null);
  const [realtimePinnedMessage, setRealtimePinnedMessage] = useState<any | null>(null);
  const [realtimeDeletedMessageId, setRealtimeDeletedMessageId] = useState<number | null>(null);
  const [realtimeReactionMessage, setRealtimeReactionMessage] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "gantt">("board");

  // Transient Realtime Highlighted Item IDs (Auto-expire after 2 seconds)
  const [highlightedCardIds, setHighlightedCardIds] = useState<Set<number>>(new Set());
  const [highlightedColumnIds, setHighlightedColumnIds] = useState<Set<number>>(new Set());

  const triggerCardHighlight = useCallback((cardId: number) => {
    setHighlightedCardIds((prev) => new Set(prev).add(cardId));
    setTimeout(() => {
      setHighlightedCardIds((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }, 2000);
  }, []);

  const triggerColumnHighlight = useCallback((columnId: number) => {
    setHighlightedColumnIds((prev) => new Set(prev).add(columnId));
    setTimeout(() => {
      setHighlightedColumnIds((prev) => {
        const next = new Set(prev);
        next.delete(columnId);
        return next;
      });
    }, 2000);
  }, []);

  const inviteTokenParam = searchParams.get("invite_token");

  // Load board data
  const loadBoard = useCallback(async (silent = false) => {
    if (!numericBoardId) return;
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCyberboardBoard(numericBoardId, inviteTokenParam);
      setBoard(data);
      setPrivateBoardError(null);

      const cardParam = searchParams.get("card");
      if (cardParam && data.cards) {
        const cardId = parseInt(cardParam, 10);
        const foundCard = data.cards.find((c) => c.id === cardId);
        if (foundCard) {
          setSelectedCard(foundCard);
        }
      }

      if (inviteTokenParam) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("invite_token");
        setSearchParams(newParams, { replace: true });
      }

      if (user && (data.created_by === user.id || isAdmin)) {
        fetchCyberboardJoinRequests(data.id)
          .then((reqs) => setPendingRequestsCount(reqs ? reqs.length : 0))
          .catch(() => {});
      }
    } catch (err: any) {
      console.error("Failed to load board details:", err);
      const isPrivateErr =
        err.is_private_board ||
        err.status === 403 ||
        (err.message && (
          err.message.toLowerCase().includes("private") ||
          err.message.toLowerCase().includes("approval") ||
          err.message.toLowerCase().includes("invite")
        ));

      if (isPrivateErr) {
        setPrivateBoardError({
          board_id: numericBoardId,
          board_title: err.board_title || "Private CyberBoard",
          host_name: err.host_name || "Board Host",
          has_pending_request: err.has_pending_request || false,
        });
      } else {
        if (!silent) setError(err.message || "Failed to load board details.");
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [numericBoardId, user, isAdmin]);

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

  const cardParam = searchParams.get("card") || searchParams.get("card_id");
  const fromTab = searchParams.get("fromTab") || undefined;
  const hasAutoOpenedCardRef = useRef(false);

  // Recursive helper to find card by id in nested cards/sub_cards array
  const findCardRecursive = (cardsList: CyberboardCard[], targetId: number): CyberboardCard | null => {
    for (const c of cardsList) {
      if (c.id === targetId) return c;
      if (c.sub_cards && c.sub_cards.length > 0) {
        const found = findCardRecursive(c.sub_cards, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Auto-open card detail modal if opened via notification link with ?card=cardId
  useEffect(() => {
    if (board && cardParam && !hasAutoOpenedCardRef.current) {
      const targetCardId = Number(cardParam);
      const allBoardCards = (board.columns || []).flatMap((col) => col.cards || []);
      const foundCard = findCardRecursive(allBoardCards, targetCardId);
      if (foundCard) {
        setSelectedCard(foundCard);
        hasAutoOpenedCardRef.current = true;

        // Clean up ?card= parameter from URL address bar so refreshing doesn't re-open card
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("card");
        newParams.delete("card_id");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [board, cardParam, searchParams, setSearchParams]);

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
        triggerCardHighlight(newCard.id);
      } else if (type === "card:updated") {
        const updatedCard: CyberboardCard = payload.card;
        setBoard((prev) => {
          if (!prev || !prev.columns) return prev;
          const updatedColumns = prev.columns.map((col) => {
            const containsInCol = (col.cards || []).some((c) => c.id === updatedCard.id);
            if (col.id === updatedCard.column_id) {
              if (containsInCol) {
                const cards = (col.cards || []).map((c) => (c.id === updatedCard.id ? { ...c, ...updatedCard } : c));
                return { ...col, cards };
              } else {
                const cards = [...(col.cards || []), updatedCard];
                return { ...col, cards };
              }
            } else if (containsInCol) {
              return { ...col, cards: (col.cards || []).filter((c) => c.id !== updatedCard.id) };
            }
            return col;
          });
          return { ...prev, columns: updatedColumns };
        });
        setSelectedCard((prev) => (prev?.id === updatedCard.id ? updatedCard : prev));
        triggerCardHighlight(updatedCard.id);
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

        triggerCardHighlight(card_id);

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

        // Trigger real-time parent completion check when any card is moved via WebSocket
        setBoard((latestBoard) => {
          if (latestBoard?.columns) {
            const allCards = latestBoard.columns.flatMap((c) => c.cards || []);
            const movedCard = allCards.find((c) => c.id === card_id);
            if (movedCard && movedCard.parent_id) {
              const parentCard = allCards.find((c) => c.id === movedCard.parent_id);
              const completedCol = latestBoard.columns.find(
                (c) =>
                  c.status_type === "completed" ||
                  c.title.toLowerCase().includes("done") ||
                  c.title.toLowerCase().includes("completed")
              );

              if (parentCard && completedCol && parentCard.column_id !== completedCol.id) {
                const siblingSubcards = allCards.filter((c) => c.parent_id === parentCard.id && !c.is_archived);
                const allSubcardsDone = siblingSubcards.length > 0 && siblingSubcards.every((sc) => {
                  const scCol = (latestBoard.columns || []).find((c) => c.id === sc.column_id);
                  if (!scCol) return false;
                  return (
                    scCol.status_type === "completed" ||
                    scCol.title.toLowerCase().includes("done") ||
                    scCol.title.toLowerCase().includes("completed")
                  );
                });

                let parentChecklistDone = true;
                if (parentCard.checklist) {
                  let cl: any[] = [];
                  if (typeof parentCard.checklist === "string") {
                    try { cl = JSON.parse(parentCard.checklist); } catch { cl = []; }
                  } else if (Array.isArray(parentCard.checklist)) {
                    cl = parentCard.checklist;
                  }
                  if (cl.length > 0) {
                    parentChecklistDone = cl.every((i) => i.completed);
                  }
                }

                if (allSubcardsDone && parentChecklistDone) {
                  updateCyberboardCard(parentCard.id, { column_id: completedCol.id }).then((updatedParent) => {
                    setBoard((b) => {
                      if (!b || !b.columns) return b;
                      const newCols = b.columns.map((col) => {
                        const contains = (col.cards || []).some((c) => c.id === updatedParent.id);
                        if (col.id === updatedParent.column_id) {
                          return {
                            ...col,
                            cards: contains
                              ? (col.cards || []).map((c) => (c.id === updatedParent.id ? { ...c, ...updatedParent } : c))
                              : [...(col.cards || []), updatedParent],
                          };
                        } else if (contains) {
                          return { ...col, cards: (col.cards || []).filter((c) => c.id !== updatedParent.id) };
                        }
                        return col;
                      });
                      return { ...b, columns: newCols };
                    });
                    showToast(`Parent card '${parentCard.title}' automatically moved to '${completedCol.title}'!`, "success");
                  }).catch((e) => console.error("Failed auto move parent on WebSocket move:", e));
                }
              }
            }
          }
          return latestBoard;
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
      } else if (type === "column:created") {
        const newCol: CyberboardColumn = payload.column;
        if (newCol) {
          setBoard((prev) => {
            if (!prev) return prev;
            const existing = prev.columns || [];
            if (existing.some((c) => c.id === newCol.id)) return prev;
            return { ...prev, columns: [...existing, newCol] };
          });
          triggerColumnHighlight(newCol.id);
        } else {
          loadBoard(true);
        }
      } else if (type === "column:updated") {
        const updatedCol: CyberboardColumn = payload.column;
        if (updatedCol) {
          setBoard((prev) => {
            if (!prev || !prev.columns) return prev;
            return {
              ...prev,
              columns: prev.columns.map((c) => (c.id === updatedCol.id ? { ...c, ...updatedCol } : c)),
            };
          });
          triggerColumnHighlight(updatedCol.id);
        } else {
          loadBoard(true);
        }
      } else if (type === "column:deleted") {
        const deletedColId = payload.column_id;
        if (deletedColId) {
          setBoard((prev) => {
            if (!prev || !prev.columns) return prev;
            return { ...prev, columns: prev.columns.filter((c) => c.id !== deletedColId) };
          });
        } else {
          loadBoard(true);
        }
      } else if (type === "chat:message_sent") {
        setRealtimeChatMessage(payload.message);
        const msgAuthorId = payload.message?.user_id || payload.message?.user?.id;
        if (!showChatSidebarRef.current && msgAuthorId && Number(msgAuthorId) !== Number(user?.id)) {
          setHasUnreadChat(true);
          setUnreadChatCount((prev) => prev + 1);
        }
      } else if (type === "chat:message_pinned") {
        setRealtimePinnedMessage(payload);
      } else if (type === "chat:message_deleted") {
        setRealtimeDeletedMessageId(payload.message_id);
      } else if (type === "chat:reaction_updated") {
        setRealtimeReactionMessage(payload);
      }
    },
    [user?.id, loadBoard, triggerCardHighlight, triggerColumnHighlight]
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

  // Compute active collaborators list (Self + Remote board presence users)
  const activeCollaboratorsList = useMemo(() => [
    ...(user
      ? [
          {
            id: user.id,
            name: user.name || "You",
            avatar: getAvatarUrl(user.avatar, user.name || "You"),
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
        avatar: getAvatarUrl(pUser.avatar, pUser.name),
        role: "Member",
        isMe: false,
        status: isDragging ? `Dragging "${isDragging.title}"` : pUser.status || "Viewing board",
      };
    }),
  ], [user, activeDragCard, boardPresenceUsers, remoteDraggingCards]);

  // Compute full board members list (Active collaborators + Offline allowed members)
  const allBoardMembersList = useMemo(() => {
    const userMap = new Map<number, any>();

    // Active presence users first
    activeCollaboratorsList.forEach((c) => userMap.set(c.id, c));

    // If private board, include offline allowed members + host
    if (board?.visibility === "private") {
      const allowedSet = new Set(board.allowed_members || []);
      const hostId = board.created_by;

      directoryMembers.forEach((m: any) => {
        if (!userMap.has(m.id) && (m.id === hostId || allowedSet.has(m.id))) {
          const name = m.name || m.username || "Member";
          userMap.set(m.id, {
            id: m.id,
            name,
            username: m.username,
            avatar: getAvatarUrl(m.avatar, name),
            role: "Member",
            isMe: user ? m.id === user.id : false,
            status: "Offline",
          });
        }
      });
    } else {
      directoryMembers.forEach((m: any) => {
        if (!userMap.has(m.id)) {
          const name = m.name || m.username || "Member";
          userMap.set(m.id, {
            id: m.id,
            name,
            username: m.username,
            avatar: getAvatarUrl(m.avatar, name),
            role: "Member",
            isMe: user ? m.id === user.id : false,
            status: "Offline",
          });
        }
      });
    }

    return Array.from(userMap.values());
  }, [board, activeCollaboratorsList, directoryMembers, user]);

  // Actions
  const handleAddSuggestion = async (data: {
    column_id?: number;
    parent_id?: number | null;
    title: string;
    description?: string;
    activity_date?: string;
    activity_end_date?: string;
    priority?: "low" | "medium" | "high";
    color_tag?: string;
    phase?: string;
    is_milestone?: boolean;
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

    const sourceColumn = board.columns.find((c) => c.id === fromColId);
    const targetColumn = board.columns.find((c) => c.id === targetColId);

    const isHost = board.created_by === user?.id;
    const isAdmin = user?.role === "admin" || user?.role === "superadmin";

    // Validate Source Column permissions (Moving Out)
    if (sourceColumn && !isHost && !isAdmin) {
      const srcAllowedRoles = sourceColumn.allowed_roles || [];
      const srcAllowedUsers = sourceColumn.allowed_users || [];
      const srcHasRestriction = srcAllowedRoles.length > 0 || srcAllowedUsers.length > 0;

      if (srcHasRestriction) {
        const roleAllowed = srcAllowedRoles.includes(user?.role || "");
        const userAllowed = user?.id ? srcAllowedUsers.includes(user.id) : false;
        if (!roleAllowed && !userAllowed) {
          showToast(
            `Permission Denied: You do not have permission to move cards out of '${sourceColumn.title}'.`,
            "error"
          );
          return;
        }
      }
    }

    // Validate Target Column permissions (Moving In)
    if (targetColumn && !isHost && !isAdmin) {
      const allowedRoles = targetColumn.allowed_roles || [];
      const allowedUsers = targetColumn.allowed_users || [];
      const hasRestriction = allowedRoles.length > 0 || allowedUsers.length > 0;

      if (hasRestriction) {
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

    // Check Predecessor Task Completion Restriction
    const predecessorIds = (targetCard.predecessor_ids && targetCard.predecessor_ids.length > 0)
      ? targetCard.predecessor_ids
      : (targetCard.predecessor_id ? [targetCard.predecessor_id] : []);

    if (predecessorIds.length > 0) {
      const allBoardCards = board.columns.flatMap((col) => col.cards || []);
      const lastColPosition = board.columns.reduce((max, c) => Math.max(max, c.position ?? 0), 0);

      const incompletePredecessors: CyberboardCard[] = [];
      for (const predId of predecessorIds) {
        const predCard = allBoardCards.find((c) => c.id === predId);
        if (predCard) {
          const predColumn = board.columns.find((c) => c.id === predCard.column_id);
          const isPredDone = predColumn && (
            predColumn.status_type === "completed" ||
            predColumn.title.toLowerCase().includes("done") ||
            predColumn.title.toLowerCase().includes("complete") ||
            (predColumn.position !== undefined && predColumn.position === lastColPosition && lastColPosition > 0)
          );
          if (!isPredDone) {
            incompletePredecessors.push(predCard);
          }
        }
      }

      const isTargetDoneOrProgress =
        targetColumn?.status_type === "completed" ||
        targetColumn?.status_type === "in_progress" ||
        targetColumn?.title.toLowerCase().includes("done") ||
        targetColumn?.title.toLowerCase().includes("progress") ||
        (targetColumn?.position !== undefined && targetColumn.position === lastColPosition && lastColPosition > 0);

      if (isTargetDoneOrProgress && incompletePredecessors.length > 0) {
        const predTitles = incompletePredecessors.map((c) => `'${c.title}'`).join(", ");
        showToast(
          `Cannot move '${targetCard.title}': Predecessor task${incompletePredecessors.length > 1 ? "s" : ""} ${predTitles} ${incompletePredecessors.length > 1 ? "are" : "is"} not completed yet!`,
          "error"
        );
        return;
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

    setSelectedCard((prev) => (prev?.id === cardId ? { ...prev, column_id: targetColId } : prev));

    // Helper function to check if parent card should auto-move to completed column when subcards finish
    const checkAndAutoMoveParentIfAllSubcardsCompleted = async (
      currentCols: CyberboardColumn[],
      childCard: CyberboardCard
    ) => {
      if (!childCard.parent_id) return;
      const allCards = currentCols.flatMap((c) => c.cards || []);
      const parentCard = allCards.find((c) => c.id === childCard.parent_id);
      if (!parentCard) return;

      const completedCol = currentCols.find(
        (c) =>
          c.status_type === "completed" ||
          c.title.toLowerCase().includes("done") ||
          c.title.toLowerCase().includes("completed")
      );
      if (!completedCol || parentCard.column_id === completedCol.id) return;

      // Check if all subcards of this parent are in completed column
      const siblingSubcards = allCards.filter((c) => c.parent_id === parentCard.id && !c.is_archived);
      if (siblingSubcards.length === 0) return;

      const allSubcardsDone = siblingSubcards.every((sc) => {
        const scCol = currentCols.find((c) => c.id === sc.column_id);
        if (!scCol) return false;
        return (
          scCol.status_type === "completed" ||
          scCol.title.toLowerCase().includes("done") ||
          scCol.title.toLowerCase().includes("completed")
        );
      });

      // Check parent checklist
      let parentChecklistDone = true;
      if (parentCard.checklist) {
        let cl: any[] = [];
        if (typeof parentCard.checklist === "string") {
          try { cl = JSON.parse(parentCard.checklist); } catch { cl = []; }
        } else if (Array.isArray(parentCard.checklist)) {
          cl = parentCard.checklist;
        }
        if (cl.length > 0) {
          parentChecklistDone = cl.every((i) => i.completed);
        }
      }

      if (allSubcardsDone && parentChecklistDone) {
        try {
          await handleUpdateCard(parentCard.id, { column_id: completedCol.id });
          showToast(`Parent card '${parentCard.title}' automatically moved to '${completedCol.title}'!`, "success");
        } catch (e) {
          console.error("Failed to auto move parent card:", e);
        }
      }
    };

    try {
      await moveCyberboardCard(cardId, targetColId, newPos);
      if (targetCard && board?.columns) {
        // Re-read latest columns state for parent check
        setBoard((latestBoard) => {
          if (latestBoard?.columns) {
            checkAndAutoMoveParentIfAllSubcardsCompleted(latestBoard.columns, targetCard!);
          }
          return latestBoard;
        });
      }
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
    const targetCard = board?.columns?.flatMap((col) => col.cards || []).find((c) => c.id === cardId);
    if (targetCard && board?.columns) {
      const predIds = (targetCard.predecessor_ids && targetCard.predecessor_ids.length > 0)
        ? targetCard.predecessor_ids
        : (targetCard.predecessor_id ? [targetCard.predecessor_id] : []);

      if (predIds.length > 0) {
        const lastColPosition = board.columns.reduce((max, c) => Math.max(max, c.position ?? 0), 0);
        const incompletePredecessors: CyberboardCard[] = [];

        for (const predId of predIds) {
          const predCard = board.columns.flatMap((col) => col.cards || []).find((c) => c.id === predId);
          if (predCard) {
            const predCol = board.columns.find((c) => c.id === predCard.column_id);
            const isPredDone = predCol && (
              predCol.status_type === "completed" ||
              predCol.title.toLowerCase().includes("done") ||
              predCol.title.toLowerCase().includes("complete") ||
              (predCol.position !== undefined && predCol.position === lastColPosition && lastColPosition > 0)
            );
            if (!isPredDone) {
              incompletePredecessors.push(predCard);
            }
          }
        }

        const isMovingToDoneOrProgress = data.column_id && (() => {
          const col = board.columns.find((c) => c.id === data.column_id);
          return col && (
            col.status_type === "completed" ||
            col.status_type === "in_progress" ||
            col.title.toLowerCase().includes("done") ||
            col.title.toLowerCase().includes("progress") ||
            (col.position !== undefined && col.position === lastColPosition && lastColPosition > 0)
          );
        })();

        const isCompletingTo100 = data.completion_percentage === 100;

        if ((isMovingToDoneOrProgress || isCompletingTo100) && incompletePredecessors.length > 0) {
          const predTitles = incompletePredecessors.map((c) => `'${c.title}'`).join(", ");
          showToast(
            `Cannot update task: Predecessor task${incompletePredecessors.length > 1 ? "s" : ""} ${predTitles} ${incompletePredecessors.length > 1 ? "are" : "is"} not completed yet!`,
            "error"
          );
          return;
        }
      }
    }

    try {
      const updatedCard = await updateCyberboardCard(cardId, data);
      setBoard((prev) => {
        if (!prev || !prev.columns) return prev;
        const updatedColumns = prev.columns.map((col) => {
          const containsInCol = (col.cards || []).some((c) => c.id === cardId);
          if (col.id === updatedCard.column_id) {
            if (containsInCol) {
              const cards = (col.cards || []).map((c) => (c.id === cardId ? { ...c, ...updatedCard } : c));
              return { ...col, cards };
            } else {
              const cards = [...(col.cards || []), updatedCard];
              return { ...col, cards };
            }
          } else if (containsInCol) {
            return { ...col, cards: (col.cards || []).filter((c) => c.id !== cardId) };
          }
          return col;
        });
        return { ...prev, columns: updatedColumns };
      });
      setSelectedCard((prev) => (prev?.id === cardId ? { ...prev, ...updatedCard } : prev));
      showToast("Card updated successfully.", "success");

      // Auto-check parent completion if subcard was updated
      if (updatedCard.parent_id) {
        setBoard((latestBoard) => {
          if (latestBoard?.columns) {
            const allCards = latestBoard.columns.flatMap((c) => c.cards || []);
            const parentCard = allCards.find((c) => c.id === updatedCard.parent_id);
            const completedCol = latestBoard.columns.find(
              (c) =>
                c.status_type === "completed" ||
                c.title.toLowerCase().includes("done") ||
                c.title.toLowerCase().includes("completed")
            );

            if (parentCard && completedCol && parentCard.column_id !== completedCol.id) {
              const siblingSubcards = allCards.filter((c) => c.parent_id === parentCard.id && !c.is_archived);
              const allSubcardsDone = siblingSubcards.length > 0 && siblingSubcards.every((sc) => {
                const scCol = (latestBoard.columns || []).find((c) => c.id === sc.column_id);
                if (!scCol) return false;
                return (
                  scCol.status_type === "completed" ||
                  scCol.title.toLowerCase().includes("done") ||
                  scCol.title.toLowerCase().includes("completed")
                );
              });

              let parentChecklistDone = true;
              if (parentCard.checklist) {
                let cl: any[] = [];
                if (typeof parentCard.checklist === "string") {
                  try { cl = JSON.parse(parentCard.checklist); } catch { cl = []; }
                } else if (Array.isArray(parentCard.checklist)) {
                  cl = parentCard.checklist;
                }
                if (cl.length > 0) {
                  parentChecklistDone = cl.every((i) => i.completed);
                }
              }

              if (allSubcardsDone && parentChecklistDone) {
                updateCyberboardCard(parentCard.id, { column_id: completedCol.id }).then((updatedParent) => {
                  setBoard((b) => {
                    if (!b || !b.columns) return b;
                    const newCols = b.columns.map((col) => {
                      const contains = (col.cards || []).some((c) => c.id === updatedParent.id);
                      if (col.id === updatedParent.column_id) {
                        return {
                          ...col,
                          cards: contains
                            ? (col.cards || []).map((c) => (c.id === updatedParent.id ? { ...c, ...updatedParent } : c))
                            : [...(col.cards || []), updatedParent],
                        };
                      } else if (contains) {
                        return { ...col, cards: (col.cards || []).filter((c) => c.id !== updatedParent.id) };
                      }
                      return col;
                    });
                    return { ...b, columns: newCols };
                  });
                  showToast(`Parent card '${parentCard.title}' automatically moved to '${completedCol.title}'!`, "success");
                }).catch((e) => console.error("Failed auto move parent:", e));
              }
            }
          }
          return latestBoard;
        });
      }
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
    status_type?: string | null;
    allowed_roles?: string[] | null;
    allowed_users?: number[] | null;
  }) => {
    if (!numericBoardId) return;
    const newCol = await createCyberboardColumn(numericBoardId, data);
    setBoard((prev) => {
      if (!prev) return prev;
      const cols = prev.columns || [];
      if (cols.some((c) => c.id === newCol.id)) return prev;
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

  if (privateBoardError) {
    return (
      <PrivateBoardAccessScreen
        boardId={privateBoardError.board_id}
        boardTitle={privateBoardError.board_title}
        hostName={privateBoardError.host_name}
        hasPendingRequest={privateBoardError.has_pending_request}
        inviteToken={inviteTokenParam}
        onSuccessJoined={() => {
          setPrivateBoardError(null);
          loadBoard();
        }}
      />
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
        fromTab={fromTab}
        activeCollaboratorsCount={activeCollaboratorsList.length}
        showCollaborators={showCollaborators}
        showChatSidebar={showChatSidebar}
        onToggleChatSidebar={() => setShowChatSidebar((prev) => !prev)}
        hasUnreadChat={hasUnreadChat}
        unreadChatCount={unreadChatCount}
        showControlsSidebar={showControlsSidebar}
        onToggleControlsSidebar={() => setShowControlsSidebar((prev) => !prev)}
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
        onExportToExcel={() => {
          if (board) {
            const allBoardCards = (board.columns || []).flatMap((col) => col.cards || []);
            exportBoardToExcel(board, board.columns || [], allBoardCards);
            showToast("Excel spreadsheet exported successfully!", "success");
          }
        }}
      />

      {/* Workspace Flex Area (Board Columns + Active Collaborators Sidebar OR Gantt Roadmap View) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {viewMode === "gantt" ? (
          <div className="flex-1 h-full overflow-hidden">
            <GanttRoadmapView
              board={board}
              columns={columns}
              cards={columns.flatMap((col) => col.cards || [])}
              canManageBoard={canManageBoard}
              currentUserId={user?.id}
              userRole={user?.role}
              boardHostId={board.created_by}
              isAdmin={isAdmin}
              onSelectCard={(card) => setSelectedCard(card)}
              onUpdateCardDate={async (cardId, activityDate, activityEndDate) => {
                await handleUpdateCard(cardId, {
                  activity_date: activityDate,
                  activity_end_date: activityEndDate,
                });
              }}
              onAddNewCard={(colId, initialData) => {
                setTargetColumnId(colId || columns[0]?.id);
                setInitialNewCardData(initialData || null);
                setShowNewSuggestionModal(true);
              }}
              onUpdateCardPhase={async (cardId, phase) => {
                await handleUpdateCard(cardId, { phase });
                showToast(`Moved task to phase "${phase}".`, "info");
              }}
              onMoveCardColumn={async (cardId, targetColumnId) => {
                await handleCardDrop(cardId, targetColumnId);
              }}
              onUpdateCardPriority={async (cardId, priority) => {
                await handleUpdateCard(cardId, { priority });
                showToast(`Updated task priority to "${priority.toUpperCase()}".`, "info");
              }}
              onUpdateCardAssignees={async (cardId, userIds) => {
                await handleUpdateCard(cardId, { assigned_user_ids: userIds });
                showToast("Updated task assignment.", "info");
              }}
              onQuickCreateCard={async (data) => {
                await handleAddSuggestion(data);
                showToast(`Created new ${data.is_milestone ? "milestone" : "task"} "${data.title}".`, "success");
              }}
            />
          </div>
        ) : (
          /* Main Kanban Columns Workspace (Horizontal Scroll) */
          <div
            onDragOver={handleBoardDragOver}
            onDrop={(e) => e.preventDefault()}
            className="flex-1 overflow-x-auto p-4 sm:p-6 flex items-start gap-4 h-full"
          >
            {columns.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface-900/30 rounded-2xl border border-dashed border-border/60 my-6 mx-auto max-w-lg">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
                  <Kanban className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-1">No Columns Created Yet</h3>
                <p className="text-xs text-text-muted max-w-md mb-5">
                  This Project Roadmap board has 0 columns. Start building your custom roadmap workflow by adding your first column!
                </p>
                {canCreateColumn && (
                  <button
                    type="button"
                    onClick={() => setShowAddColumnModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-primary text-surface-950 text-xs font-bold shadow-md hover:bg-primary-hover transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Column</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {columns.map((column) => (
                  <BoardColumn
                    key={column.id}
                    column={column}
                    boardType={board.type}
                    currentUserId={user?.id}
                    userRole={user?.role}
                    boardHostId={board.created_by}
                    isAdmin={isAdmin}
                    isHighlighted={highlightedColumnIds.has(column.id)}
                    highlightedCardIds={highlightedCardIds}
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
              </>
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
      {selectedCard && (() => {
        const liveSelectedCard = columns.flatMap((c) => c.cards || []).find((c) => c.id === selectedCard.id) || selectedCard;
        return (
          <CardDetailModal
            card={liveSelectedCard}
          allBoardCards={columns.flatMap((c) => c.cards || [])}
          boardType={board?.type}
          boardVisibility={board.visibility}
          allowedMembers={board.allowed_members}
          boardPhases={board.phase_settings}
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
          onClose={() => {
            setSelectedCard(null);
            if (wasMediaVaultOpenBeforeCard) {
              setShowMediaVaultModal(true);
              setWasMediaVaultOpenBeforeCard(false);
            }
            if (searchParams.has("card") || searchParams.has("card_id")) {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete("card");
              newParams.delete("card_id");
              setSearchParams(newParams, { replace: true });
            }
          }}
          onVoteToggle={handleVoteToggle}
          onAddComment={handleAddComment}
          onDeleteComment={(commentId) => handleDeleteComment(selectedCard.id, commentId)}
          onDeleteCard={handleDeleteCard}
          columns={columns}
          onUpdateCard={handleUpdateCard}
          onNavigateToSubtask={(subtask) => {
            setSelectedCard(subtask);
          }}
          onShowToast={(msg, type) => showToast(msg, type)}
        />
        );
      })()}

      {/* New Suggestion Modal */}
      {showNewSuggestionModal && (
        <NewSuggestionModal
          boardId={board.id}
          boardVisibility={board.visibility}
          allowedMembers={board.allowed_members}
          boardPhases={board.phase_settings}
          columns={columns}
          allCards={columns.flatMap((c) => c.cards || [])}
          boardType={board.type}
          defaultColumnId={targetColumnId}
          initialData={initialNewCardData}
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
          collaboratorsList={allBoardMembersList}
          boardVisibility={board?.visibility}
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

      {/* Unified Board Controls Sidebar Overlay */}
      {board && (
        <BoardControlsSidebar
          isOpen={showControlsSidebar}
          onClose={() => setShowControlsSidebar(false)}
          board={board}
          activeCollaboratorsCount={activeCollaboratorsList.length}
          boardPresenceUsers={boardPresenceUsers}
          copiedLink={copiedLink}
          canManageBoard={canManageBoard}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCopyShareLink={handleCopyShareLink}
          onOpenSettings={() => setShowBoardSettingsModal(true)}
          onOpenBoardAuditLog={() => setShowBoardAuditLog(true)}
          onOpenMediaVault={() => setShowMediaVaultModal(true)}
          onOpenJoinRequests={isHost || isAdmin ? () => setShowJoinRequestsPanel(true) : undefined}
          pendingRequestsCount={pendingRequestsCount}
          onGenerateInviteLink={board.visibility === "private" ? async () => {
            try {
              const res = await generateCyberboardInviteLink(board.id);
              const inviteUrl = `${window.location.origin}/app/cyberboard/${board.id}?invite_token=${res.token}`;
              await navigator.clipboard.writeText(inviteUrl);
              showToast("Single-use 6h invite link copied to clipboard!", "success");
            } catch (err: any) {
              showToast(err.message || "Failed to generate invite link.", "error");
            }
          } : undefined}
          onExportToExcel={() => {
            if (board) {
              const allBoardCards = (board.columns || []).flatMap((col) => col.cards || []);
              exportBoardToExcel(board, board.columns || [], allBoardCards);
              showToast("Excel spreadsheet exported successfully!", "success");
            }
          }}
        />
      )}

      {/* Host & Admin Join Requests Panel */}
      {board && (
        <BoardJoinRequestsPanel
          boardId={board.id}
          isOpen={showJoinRequestsPanel}
          onClose={() => setShowJoinRequestsPanel(false)}
          onToast={showToast}
        />
      )}

      {/* Board Media & Links Vault Modal */}
      {board && (
        <BoardMediaVaultModal
          boardId={board.id}
          isOpen={showMediaVaultModal}
          onClose={() => {
            setShowMediaVaultModal(false);
            setWasMediaVaultOpenBeforeCard(false);
          }}
          onSelectCard={(cardId) => {
            const allCards = (board.columns || []).flatMap((c) => c.cards || []);
            const foundCard = allCards.find((c) => c.id === cardId);
            if (foundCard) {
              setWasMediaVaultOpenBeforeCard(true);
              setShowMediaVaultModal(false);
              setSelectedCard(foundCard);
            }
          }}
          onToast={showToast}
        />
      )}

      {/* CyberBoard Realtime Board Sidebar Chat */}
      {board && (
        <CyberboardChatSidebar
          isOpen={showChatSidebar}
          onClose={() => setShowChatSidebar(false)}
          board={board}
          allUsers={allBoardMembersList}
          realtimeChatMessage={realtimeChatMessage}
          realtimePinnedMessage={realtimePinnedMessage}
          realtimeDeletedMessageId={realtimeDeletedMessageId}
          realtimeReactionMessage={realtimeReactionMessage}
        />
      )}
    </div>
  );
}
