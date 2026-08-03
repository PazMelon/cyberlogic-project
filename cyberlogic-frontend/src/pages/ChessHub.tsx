import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { useChessRealtime } from '../hooks/useChessRealtime';
import {
  fetchChessGames,
  createChessGame,
  deleteChessGame,
  fetchChessLeaderboard,
  fetchUserChessStats,
  fetchLobbyMessages,
  sendLobbyMessage,
  fetchChessTournaments,
  fetchChessTournament,
  createChessTournament,
  joinChessTournament,
  leaveChessTournament,
  startChessTournament,
  deleteChessTournament,
  fetchChessMatchHistory,
  type ChessGame,
  type ChessPlayerStat,
  type ChessLobbyChatMessage,
  type ChessTournament,
} from '../utils/chessApi';
import { Swords, Trophy, Users, Award, Plus, Play, UserPlus, LogOut, Trash2, History, ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useDialog } from '../utils/useDialog';
import { ChessWelcomeBanner } from '../components/chess/ChessWelcomeBanner';
import { AvailableMatchRoomsCard } from '../components/chess/AvailableMatchRoomsCard';
import { ChessLeaderboardCard } from '../components/chess/ChessLeaderboardCard';
import { OnlinePlayersCard } from '../components/chess/OnlinePlayersCard';
import { LobbyMessageHubCard } from '../components/chess/LobbyMessageHubCard';
import { CreateMatchModal } from '../components/chess/CreateMatchModal';
import { MobileCommunityDrawer } from '../components/chess/MobileCommunityDrawer';
import { ChessTournamentBracket } from '../components/chess/ChessTournamentBracket';
import { CreateTournamentModal } from '../components/chess/CreateTournamentModal';
import { ChessMatchHistoryCard } from '../components/chess/ChessMatchHistoryCard';

export default function ChessHub() {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { onlineUsers } = useWebSocket();
  const { lobbyMessages: wsLobbyMessages, sendLobbyChat, latestGameUpdate } = useChessRealtime();

  const [games, setGames] = useState<ChessGame[]>([]);
  const [leaderboard, setLeaderboard] = useState<ChessPlayerStat[]>([]);
  const [userStat, setUserStat] = useState<ChessPlayerStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lobby' | 'tournaments' | 'leaderboard' | 'history'>('lobby');
  const [leaderboardSort, setLeaderboardSort] = useState<'elo' | 'reputation'>('elo');

  // Match History State
  const [history, setHistory] = useState<ChessGame[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Tournaments State
  const [tournaments, setTournaments] = useState<ChessTournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<ChessTournament | null>(null);
  const [showCreateTournamentModal, setShowCreateTournamentModal] = useState(false);

  // Create Game Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gameType, setGameType] = useState<'ranked' | 'casual'>('ranked');
  const [timeControl, setTimeControl] = useState<number>(5);
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [colorPref, setColorPref] = useState<'white' | 'black' | 'random'>('random');
  const [creating, setCreating] = useState(false);

  // Mobile Slideout Drawer State
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [mobileDrawerTab, setMobileDrawerTab] = useState<'players' | 'chat'>('players');

  // Chat State (7-Day Retention & Paginated Backreading)
  const [messages, setMessages] = useState<ChessLobbyChatMessage[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const desktopChatRef = useRef<HTMLDivElement>(null);
  const mobileChatRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (tabsContainerRef.current && e.deltaY) {
      tabsContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('chess_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('chess_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Challenge player target
  const [challengingUserId, setChallengingUserId] = useState<number | null>(null);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const historyList = await fetchChessMatchHistory();
      setHistory(historyList);
    } catch (err) {
      console.error('[ChessHub] Failed to fetch match history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [gamesList, lbData, myStats, tourneys, historyList] = await Promise.all([
        fetchChessGames(),
        fetchChessLeaderboard(leaderboardSort),
        fetchUserChessStats(),
        fetchChessTournaments(),
        fetchChessMatchHistory().catch(() => []),
      ]);
      setGames(gamesList);
      setLeaderboard(lbData);
      setUserStat(myStats);
      setTournaments(tourneys);
      setHistory(historyList);
    } catch (err) {
      console.error('[ChessHub] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [leaderboardSort]);

  // Load state from URL search params on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const tourneyParam = searchParams.get('tournament');

    if (tabParam === 'tournaments') {
      setActiveTab('tournaments');
    } else if (tabParam === 'lobby') {
      setActiveTab('lobby');
    } else if (tabParam === 'leaderboard') {
      setActiveTab('leaderboard');
    } else if (tabParam === 'history') {
      setActiveTab('history');
    }

    if (tourneyParam && !isNaN(Number(tourneyParam))) {
      const tId = Number(tourneyParam);
      fetchChessTournament(tId).then((fullT) => setSelectedTournament(fullT)).catch(console.error);
    }
  }, []);

  // Synchronize browser URL query params whenever tab or selected tournament changes
  useEffect(() => {
    const params: Record<string, string> = { tab: activeTab };
    if (activeTab === 'tournaments' && selectedTournament?.id) {
      params.tournament = String(selectedTournament.id);
    }
    setSearchParams(params, { replace: true });
  }, [activeTab, selectedTournament?.id, setSearchParams]);

  const handleCreateTournament = async (data: {
    title: string;
    description?: string;
    max_players: number;
    time_control: number;
    type: 'ranked' | 'casual';
  }) => {
    const created = await createChessTournament(data);
    setTournaments((prev) => [created, ...prev]);
    setSelectedTournament(created);
    showAlert({
      title: 'Tournament Created!',
      message: `${created.title} is now open for player registration!`,
      type: 'success',
    });
  };

  const handleJoinTournament = async (tId: number) => {
    try {
      const updated = await joinChessTournament(tId);
      setTournaments((prev) => prev.map((t) => (t.id === tId ? updated : t)));
      if (selectedTournament?.id === tId) setSelectedTournament(updated);
    } catch (err: any) {
      showAlert({
        title: 'Join Error',
        message: err.message || 'Could not join tournament',
        type: 'error',
      });
    }
  };

  const handleLeaveTournament = async (tId: number) => {
    try {
      const updated = await leaveChessTournament(tId);
      setTournaments((prev) => prev.map((t) => (t.id === tId ? updated : t)));
      if (selectedTournament?.id === tId) setSelectedTournament(updated);
    } catch (err: any) {
      showAlert({
        title: 'Leave Error',
        message: err.message || 'Could not leave tournament',
        type: 'error',
      });
    }
  };

  const handleStartTournament = async (tId: number) => {
    const confirm = await showConfirm({
      title: 'Start Championship Bracket?',
      message: 'Randomly pair registered players and generate the tournament bracket now?',
      type: 'warning',
      confirmText: 'Start Tournament',
    });
    if (!confirm) return;

    try {
      await startChessTournament(tId);
      const fullT = await fetchChessTournament(tId);
      const allTourneys = await fetchChessTournaments();
      setTournaments(allTourneys);
      setSelectedTournament(fullT);
      showAlert({
        title: 'Tournament Started!',
        message: 'Matches have been generated! Players can now enter their round games.',
        type: 'success',
      });
    } catch (err: any) {
      showAlert({
        title: 'Start Error',
        message: err.message || 'Could not start tournament',
        type: 'error',
      });
    }
  };

  const handleDeleteTournament = async (tId: number, isLive: boolean) => {
    const isConfirmed = await showConfirm({
      title: isLive ? 'Cancel Active Tournament?' : 'Delete Tournament?',
      message: isLive
        ? 'Are you sure you want to cancel this active tournament? All ongoing matches will be stopped and deleted.'
        : 'Are you sure you want to delete this unstarted tournament? This will remove all registrations.',
      confirmText: isLive ? 'Cancel Tournament' : 'Delete Tournament',
      type: 'danger',
    });

    if (isConfirmed) {
      try {
        await deleteChessTournament(tId);
        setTournaments((prev) => prev.filter((t) => t.id !== tId));
        if (selectedTournament?.id === tId) setSelectedTournament(null);
        showAlert({
          title: isLive ? 'Tournament Cancelled' : 'Tournament Deleted',
          message: 'The tournament has been successfully removed.',
          type: 'success',
        });
      } catch (err: any) {
        showAlert({
          title: 'Action Failed',
          message: err.message || 'Failed to delete tournament.',
          type: 'error',
        });
      }
    }
  };

  // Load initial lobby messages from 7-day retention DB
  useEffect(() => {
    fetchLobbyMessages()
      .then((data) => {
        setMessages(data.messages);
        setHasMoreMessages(data.has_more);
        setTimeout(() => {
          if (desktopChatRef.current) desktopChatRef.current.scrollTop = desktopChatRef.current.scrollHeight;
          if (mobileChatRef.current) mobileChatRef.current.scrollTop = mobileChatRef.current.scrollHeight;
        }, 100);
      })
      .catch((err) => console.error('[ChessHub] Failed to fetch lobby messages:', err));
  }, []);

  // Merge live incoming WebSocket lobby messages
  useEffect(() => {
    if (wsLobbyMessages.length > 0) {
      setMessages((prev) => {
        const updated = [...prev];
        wsLobbyMessages.forEach((wsMsg) => {
          const exists = updated.some(
            (m) =>
              (m.id && wsMsg.id && m.id === wsMsg.id) ||
              (m.text === wsMsg.text && m.sender?.id === wsMsg.sender?.id && Math.abs(new Date(m.created_at || 0).getTime() - new Date(wsMsg.created_at || 0).getTime()) < 3000)
          );
          if (!exists) {
            updated.push(wsMsg as any);
          }
        });
        return updated;
      });

      setTimeout(() => {
        if (desktopChatRef.current) {
          const c = desktopChatRef.current;
          if (c.scrollHeight - c.scrollTop - c.clientHeight < 150) {
            c.scrollTop = c.scrollHeight;
          }
        }
        if (mobileChatRef.current) {
          const c = mobileChatRef.current;
          if (c.scrollHeight - c.scrollTop - c.clientHeight < 150) {
            c.scrollTop = c.scrollHeight;
          }
        }
      }, 50);
    }
  }, [wsLobbyMessages]);

  // Backreading / Infinite Scroll Handler when scrolling UP to load older 7-day messages
  const handleScrollBackread = async (containerRef: React.RefObject<HTMLDivElement | null>) => {
    const container = containerRef.current;
    if (!container || !hasMoreMessages || loadingMoreMessages || messages.length === 0) return;

    if (container.scrollTop < 25) {
      setLoadingMoreMessages(true);
      const oldestId = messages[0].id;
      const oldScrollHeight = container.scrollHeight;

      try {
        const data = await fetchLobbyMessages(oldestId);
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMoreMessages(data.has_more);

        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - oldScrollHeight;
          }
        });
      } catch (err) {
        console.error('[ChessHub] Backreading failed:', err);
      } finally {
        setLoadingMoreMessages(false);
      }
    }
  };

  // Listen for real-time game room updates & live tournament updates
  useEffect(() => {
    if (latestGameUpdate) {
      setGames((prev) => {
        const index = prev.findIndex((g) => g.id === latestGameUpdate.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = latestGameUpdate;
          return updated;
        } else {
          return [latestGameUpdate, ...prev];
        }
      });
    }
  }, [latestGameUpdate]);

  // Subscribe to live tournament & match lobby WebSocket events
  const { subscribe } = useWebSocket();
  useEffect(() => {
    const unsubLobby = subscribe('chess_lobby', (payload: any, type: string) => {
      const isTournament =
        type === 'chess_tournament_updated' ||
        type === 'tournament_created' ||
        type === 'tournament_completed' ||
        type === 'tournament_started' ||
        payload?.event === 'tournament_started' ||
        payload?.event === 'tournament_completed' ||
        payload?.event === 'tournament_updated';

      const isGame =
        type === 'chess_game_created' ||
        type === 'chess_game_updated' ||
        type === 'chess_move' ||
        type === 'chess_game_over';

      if (isTournament) {
        fetchChessTournaments().then((tourneys) => setTournaments(tourneys)).catch(console.error);
        if (selectedTournament?.id) {
          fetchChessTournament(selectedTournament.id).then((fullT) => setSelectedTournament(fullT)).catch(console.error);
        }
      }

      if (isGame) {
        fetchChessGames().then((gamesList) => setGames(gamesList)).catch(console.error);
        if (selectedTournament?.id) {
          fetchChessTournament(selectedTournament.id).then((fullT) => setSelectedTournament(fullT)).catch(console.error);
        }
      }
    });

    return () => unsubLobby();
  }, [subscribe, selectedTournament?.id]);

  useEffect(() => {
    if (!selectedTournament?.id) return;
    const channelName = `chess_tournament_${selectedTournament.id}`;
    const unsubTourney = subscribe(channelName, () => {
      fetchChessTournament(selectedTournament.id).then((fullT: ChessTournament) => setSelectedTournament(fullT)).catch(console.error);
    });

    return () => unsubTourney();
  }, [subscribe, selectedTournament?.id]);

  const handleCreateGame = async () => {
    setCreating(true);
    try {
      const newGame = await createChessGame({
        type: gameType,
        time_control: timeControl === 0 ? null : timeControl,
        allow_spectators: allowSpectators,
        color_preference: colorPref,
        invitee_id: challengingUserId || null,
      });

      setShowCreateModal(false);
      setShowMobileDrawer(false);
      setChallengingUserId(null);
      navigate(`/app/chess/game/${newGame.game_code}`);
    } catch (err) {
      console.error('[ChessHub] Failed to create game:', err);
      showAlert({
        title: 'Error Creating Game',
        message: 'Could not create game room. Please try again.',
        type: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const textToSend = chatInput.trim();
    setChatInput('');

    try {
      const created = await sendLobbyMessage(textToSend);
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === created.id);
        if (exists) return prev;
        return [...prev, created];
      });

      setTimeout(() => {
        if (desktopChatRef.current) desktopChatRef.current.scrollTop = desktopChatRef.current.scrollHeight;
        if (mobileChatRef.current) mobileChatRef.current.scrollTop = mobileChatRef.current.scrollHeight;
      }, 50);
    } catch (err) {
      sendLobbyChat(textToSend);
    }
  };

  const copyInviteLink = (gameCode: string) => {
    const url = `${window.location.origin}/app/chess/game/${gameCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(gameCode);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleDeleteGame = async (gameCode: string) => {
    const confirmed = await showConfirm({
      title: 'Cancel Match Room?',
      message: 'Are you sure you want to delete this open match room?',
      type: 'warning',
      confirmText: 'Yes, Delete',
    });
    if (!confirmed) return;

    try {
      await deleteChessGame(gameCode);
      setGames((prev) => prev.filter((g) => g.game_code !== gameCode));
    } catch (err) {
      console.error('[ChessHub] Delete game failed:', err);
      showAlert({
        title: 'Error Deleting Room',
        message: 'Could not delete the match room.',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6 text-[var(--cl-text-primary)] font-sans relative">
      {/* Main Grid Layout (Responsive: 1-Column on mobile/tablet/laptop, 3-Column on xl displays) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left/Main Content Column (2 Columns Wide on XL, 3 Columns Wide when Sidebar Collapsed) */}
        <div className={`space-y-6 min-w-0 ${isSidebarCollapsed ? 'xl:col-span-3' : 'xl:col-span-2'}`}>
          {/* Welcome Header Banner (Constrained to Left Main Column) */}
          <ChessWelcomeBanner
            userName={user?.first_name || user?.name}
            userStat={userStat}
            onOpenCreateModal={() => setShowCreateModal(true)}
          />

          {/* Main Navigation Tabs - Responsive Docked Sticky Header with Scroll & Minimize Sideways Controls */}
          <div className="sticky -top-4 sm:-top-6 lg:-top-8 z-20 bg-[var(--cl-surface-950)]/95 backdrop-blur-md py-2 sm:py-2.5 px-2 border-b border-[var(--cl-border)] rounded-2xl shadow-xl transition-all flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => scrollTabs('left')}
              className="p-2 rounded-xl bg-[var(--cl-surface-900)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] transition-all cursor-pointer shrink-0 shadow-sm"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div
              ref={tabsContainerRef}
              onWheel={handleTabsWheel}
              className="flex items-center gap-2 overflow-x-auto flex-nowrap w-full no-scrollbar touch-pan-x scroll-smooth py-1 px-1"
            >
              <button
                onClick={() => {
                  setActiveTab('lobby');
                  setSelectedTournament(null);
                }}
                className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'lobby'
                    ? 'bg-[var(--cl-primary)] text-slate-950 scale-[1.02]'
                    : 'bg-[var(--cl-surface-900)] text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)]'
                }`}
              >
                <Swords className="w-4 h-4 shrink-0" /> Match Lobby & Chat
              </button>
              <button
                onClick={() => setActiveTab('tournaments')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'tournaments'
                    ? 'bg-[var(--cl-primary)] text-slate-950 scale-[1.02]'
                    : 'bg-[var(--cl-surface-900)] text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)]'
                }`}
              >
                <Trophy className="w-4 h-4 shrink-0" /> Tournaments & Brackets
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'leaderboard'
                    ? 'bg-[var(--cl-primary)] text-slate-950 scale-[1.02]'
                    : 'bg-[var(--cl-surface-900)] text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)]'
                }`}
              >
                <Award className="w-4 h-4 shrink-0" /> Global Leaderboards
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'history'
                    ? 'bg-[var(--cl-primary)] text-slate-950 scale-[1.02]'
                    : 'bg-[var(--cl-surface-900)] text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)]'
                }`}
              >
                <History className="w-4 h-4 shrink-0" /> Match History
              </button>
            </div>

            <button
              onClick={() => scrollTabs('right')}
              className="p-2 rounded-xl bg-[var(--cl-surface-900)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] transition-all cursor-pointer shrink-0 shadow-sm"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-2 rounded-xl bg-[var(--cl-surface-900)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] transition-all cursor-pointer shrink-0 text-xs font-bold items-center gap-1.5 shadow-sm active:scale-95 ml-1 border-l border-[var(--cl-border)]/60"
              title={isSidebarCollapsed ? 'Expand Right Sidebar' : 'Minimize Sideways'}
            >
              {isSidebarCollapsed ? (
                <>
                  <PanelRightOpen className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="whitespace-nowrap">Show Sidebar</span>
                </>
              ) : (
                <>
                  <PanelRightClose className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="whitespace-nowrap">Minimize Sideways</span>
                </>
              )}
            </button>
          </div>

          {/* Active Tab Content */}
          {activeTab === 'lobby' && (
            <AvailableMatchRoomsCard
              games={games}
              loading={loading}
              currentUserId={user?.id}
              copiedCode={copiedCode}
              onCopyInviteLink={copyInviteLink}
              onNavigateGame={(code) => navigate(`/app/chess/game/${code}`)}
              onOpenCreateModal={() => setShowCreateModal(true)}
              onDeleteGame={handleDeleteGame}
            />
          )}

          {activeTab === 'tournaments' && (
            <div className="space-y-6">
              {/* Header & Create Tournament Trigger */}
              <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl p-5 shadow-xl flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[var(--cl-text-primary)] flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" /> Championship Arena
                  </h2>
                  <p className="text-xs text-[var(--cl-text-muted)] mt-0.5">
                    Single-elimination random seed tournament brackets leading to championship!
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateTournamentModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Create Tournament
                </button>
              </div>

              {/* Selected Tournament Bracket View */}
              {selectedTournament ? (
                <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--cl-border)]/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTournament(null)}
                          className="text-xs font-bold text-[var(--cl-primary-light)] hover:underline"
                        >
                          ← Back to All Tournaments
                        </button>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {selectedTournament.status}
                        </span>
                      </div>
                      <h2 className="text-xl font-extrabold text-[var(--cl-text-primary)] mt-1">
                        {selectedTournament.title}
                      </h2>
                      {selectedTournament.description && (
                        <p className="text-xs text-[var(--cl-text-secondary)] mt-1.5 leading-relaxed bg-[var(--cl-surface-950)] border border-[var(--cl-border)]/50 rounded-xl p-2.5 max-w-2xl italic font-medium">
                          "{selectedTournament.description}"
                        </p>
                      )}
                      <p className="text-xs text-[var(--cl-text-muted)] mt-1.5 font-medium">
                        Time Control: {selectedTournament.time_control} mins | Max Players: {selectedTournament.max_players} | Mode: {selectedTournament.elimination_mode === 'double' ? '🛡️ Double Knockout' : '⚡ Single Knockout'}
                      </p>
                    </div>

                    {/* Action Controls based on Tournament Status */}
                    <div className="flex items-center gap-2">
                      {selectedTournament.status === 'registration' && (
                        <>
                          {selectedTournament.participants?.some((p) => p.user_id === user?.id) ? (
                            <button
                              onClick={() => handleLeaveTournament(selectedTournament.id)}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <LogOut className="w-3.5 h-3.5" /> Leave Registration
                            </button>
                          ) : (
                            <button
                              onClick={() => handleJoinTournament(selectedTournament.id)}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Register for Tournament
                            </button>
                          )}

                          {(user?.role === 'admin' || user?.role === 'superadmin' || selectedTournament.creator_id === user?.id) && (
                            <button
                              onClick={() => handleStartTournament(selectedTournament.id)}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--cl-primary)] hover:brightness-110 text-slate-950 shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" /> Start Championship
                            </button>
                          )}
                        </>
                      )}

                      {(user?.role === 'admin' || user?.role === 'superadmin' || selectedTournament.creator_id === user?.id) && selectedTournament.status === 'registration' && (
                        <button
                          onClick={() => handleDeleteTournament(selectedTournament.id, false)}
                          className="p-2 rounded-xl text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
                          title="Delete Unstarted Tournament"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {selectedTournament.status === 'in_progress' && (user?.role === 'admin' || user?.role === 'superadmin' || selectedTournament.creator_id === user?.id) && (
                        <button
                          onClick={() => handleDeleteTournament(selectedTournament.id, true)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Cancel Live Tournament
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bracket Component */}
                  <ChessTournamentBracket tournament={selectedTournament} currentUserId={user?.id} />
                </div>
              ) : (
                /* Tournaments Grid List */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tournaments.length === 0 ? (
                    <div className="col-span-2 bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl p-10 text-center text-xs text-[var(--cl-text-muted)]">
                      No active tournaments right now. Click "Create Tournament" to launch one!
                    </div>
                  ) : (
                    tournaments.map((t) => {
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTournament(t)}
                          className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] hover:border-[var(--cl-primary)]/50 rounded-2xl p-5 shadow-xl transition-all cursor-pointer group hover:scale-[1.01] space-y-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border mb-1.5 ${
                                t.status === 'registration'
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  : t.status === 'in_progress'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
                              }`}>
                                {t.status}
                              </span>
                              <h3 className="font-extrabold text-base text-[var(--cl-text-primary)] group-hover:text-[var(--cl-primary-light)] transition-colors">
                                {t.title}
                              </h3>
                              <p className="text-xs text-[var(--cl-text-muted)] mt-1 font-medium">
                                Mode: {t.elimination_mode === 'double' ? 'Double Knockout' : 'Single Knockout'} • {t.time_control} min matches
                              </p>
                            </div>
                            <span className="text-xs font-mono text-[var(--cl-primary-light)] font-bold bg-[var(--cl-surface-950)] px-2.5 py-1 rounded-lg border border-[var(--cl-border)] shrink-0">
                              {t.participants?.length || 0}/{t.max_players} Players
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-[var(--cl-text-muted)]">
                              Created by {t.creator?.name || 'Player'}
                            </span>
                            <div className="flex items-center gap-2">
                              {(t.creator_id === user?.id || user?.role === 'admin' || user?.role === 'superadmin') && t.status !== 'completed' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTournament(t.id, t.status === 'in_progress');
                                  }}
                                  className="p-1 rounded text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                                  title={t.status === 'in_progress' ? 'Cancel Live Tournament' : 'Delete Tournament'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <span className="text-xs font-bold text-[var(--cl-primary-light)] group-hover:translate-x-1 transition-transform">
                                View Bracket →
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <ChessLeaderboardCard
              leaderboard={leaderboard}
              leaderboardSort={leaderboardSort}
              onSetLeaderboardSort={setLeaderboardSort}
            />
          )}

          {activeTab === 'history' && (
            <ChessMatchHistoryCard
              history={history}
              loading={loadingHistory}
              onRefresh={loadHistory}
            />
          )}
        </div>

        {/* Right 1-Column Persistent Sidebar (Collapsible Sideways) */}
        {!isSidebarCollapsed && (
          <div className="hidden lg:flex flex-col space-y-4 sticky top-0 self-start h-[calc(100vh-6.5rem)] max-h-[calc(100vh-6.5rem)] overflow-hidden pt-0.5 pb-4 transition-all duration-300">
            <OnlinePlayersCard
              onlineUsers={onlineUsers}
              currentUserId={user?.id}
              onChallengeUser={(targetId) => {
                setChallengingUserId(targetId);
                setShowCreateModal(true);
              }}
            />

            <LobbyMessageHubCard
              messages={messages}
              chatInput={chatInput}
              loadingMoreMessages={loadingMoreMessages}
              desktopChatRef={desktopChatRef}
              onScrollBackread={handleScrollBackread}
              onSendChat={handleSendChat}
              onChatInputChange={setChatInput}
            />
          </div>
        )}
      </div>

      {/* Floating Mobile Trigger Button */}
      <button
        onClick={() => setShowMobileDrawer(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-[var(--cl-primary)] text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-white/20 cursor-pointer"
      >
        <Users className="w-5 h-5" />
        <span className="text-xs uppercase tracking-wider">Community Hub ({onlineUsers.length})</span>
      </button>

      {/* Mobile Slideout Drawer Component */}
      <MobileCommunityDrawer
        show={showMobileDrawer}
        drawerTab={mobileDrawerTab}
        onlineUsers={onlineUsers}
        currentUserId={user?.id}
        messages={messages}
        chatInput={chatInput}
        loadingMoreMessages={loadingMoreMessages}
        mobileChatRef={mobileChatRef}
        onClose={() => setShowMobileDrawer(false)}
        onSetDrawerTab={setMobileDrawerTab}
        onChallengeUser={(targetId) => {
          setChallengingUserId(targetId);
          setShowCreateModal(true);
        }}
        onScrollBackread={handleScrollBackread}
        onSendChat={handleSendChat}
        onChatInputChange={setChatInput}
      />

      {/* Create Match Modal */}
      <CreateMatchModal
        show={showCreateModal}
        gameType={gameType}
        timeControl={timeControl}
        allowSpectators={allowSpectators}
        colorPref={colorPref}
        creating={creating}
        onClose={() => setShowCreateModal(false)}
        onSetGameType={setGameType}
        onSetTimeControl={setTimeControl}
        onSetAllowSpectators={setAllowSpectators}
        onSetColorPref={setColorPref}
        onCreateGame={handleCreateGame}
      />

      {/* Create Tournament Modal */}
      <CreateTournamentModal
        isOpen={showCreateTournamentModal}
        onClose={() => setShowCreateTournamentModal(false)}
        onCreate={handleCreateTournament}
      />
    </div>
  );
}
