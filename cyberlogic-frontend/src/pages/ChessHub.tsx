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
  type ChessGame,
  type ChessPlayerStat,
  type ChessLobbyChatMessage,
  type ChessTournament,
} from '../utils/chessApi';
import { Swords, Trophy, Users, Award, Plus, Play, UserPlus, LogOut, Trash2 } from 'lucide-react';
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

export default function ChessHub() {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { onlineUsers } = useWebSocket();
  const { lobbyMessages: wsLobbyMessages, sendLobbyChat, latestGameUpdate } = useChessRealtime();

  const [games, setGames] = useState<ChessGame[]>([]);
  const [leaderboard, setLeaderboard] = useState<ChessPlayerStat[]>([]);
  const [userStat, setUserStat] = useState<ChessPlayerStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lobby' | 'tournaments' | 'leaderboard'>('lobby');
  const [leaderboardSort, setLeaderboardSort] = useState<'elo' | 'reputation'>('elo');

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

  // Challenge player target
  const [challengingUserId, setChallengingUserId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gamesList, lbData, myStats, tourneys] = await Promise.all([
        fetchChessGames(),
        fetchChessLeaderboard(leaderboardSort),
        fetchUserChessStats(),
        fetchChessTournaments(),
      ]);
      setGames(gamesList);
      setLeaderboard(lbData);
      setUserStat(myStats);
      setTournaments(tourneys);
    } catch (err) {
      console.error('[ChessHub] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [leaderboardSort]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const tourneyParam = searchParams.get('tournament');

    if (tabParam === 'tournaments') {
      setActiveTab('tournaments');
    } else if (tabParam === 'lobby') {
      setActiveTab('lobby');
    }

    if (tourneyParam && !isNaN(Number(tourneyParam))) {
      const tId = Number(tourneyParam);
      fetchChessTournament(tId).then((fullT) => setSelectedTournament(fullT)).catch(console.error);
    }
  }, [searchParams]);

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

  // Subscribe to live tournament WebSocket events (Lobby & Active Tournament channel)
  const { subscribe } = useWebSocket();
  useEffect(() => {
    const unsubLobby = subscribe('chess_lobby', (_payload: any, event: string) => {
      if (
        event === 'chess_tournament_updated' ||
        event === 'tournament_created' ||
        event === 'tournament_completed' ||
        event === 'tournament_started'
      ) {
        fetchChessTournaments().then((tourneys) => {
          setTournaments(tourneys);
          if (selectedTournament?.id) {
            fetchChessTournament(selectedTournament.id).then((fullT: ChessTournament) => setSelectedTournament(fullT));
          }
        });
      }
    });

    return () => unsubLobby();
  }, [subscribe, selectedTournament?.id]);

  useEffect(() => {
    if (!selectedTournament?.id) return;
    const channelName = `chess_tournament_${selectedTournament.id}`;
    const unsubTourney = subscribe(channelName, (_payload: any) => {
      fetchChessTournament(selectedTournament.id).then((fullT: ChessTournament) => setSelectedTournament(fullT));
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
      {/* Main Grid Layout (2-Column Main + 1-Column Right Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left/Main Content Column (2 Columns Wide) */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Welcome Header Banner (Constrained to Left Main Column) */}
          <ChessWelcomeBanner
            userName={user?.first_name || user?.name}
            userStat={userStat}
            onOpenCreateModal={() => setShowCreateModal(true)}
          />

          {/* Main Navigation Tabs - Fixed Sticky Header constrained to main column */}
          <div className="sticky top-0 z-20 bg-[var(--cl-surface-950)]/95 backdrop-blur-md py-2.5 px-1 border-b border-[var(--cl-border)] flex items-center gap-2 overflow-x-auto no-scrollbar rounded-xl">
            <button
              onClick={() => {
                setActiveTab('lobby');
                setSelectedTournament(null);
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'lobby'
                  ? 'bg-[var(--cl-primary)] text-slate-950 scale-[1.02]'
                  : 'bg-[var(--cl-surface-900)] text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)]'
              }`}
            >
              <Swords className="w-4 h-4" /> Match Lobby & Chat
            </button>
            <button
              onClick={() => setActiveTab('tournaments')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tournaments'
                  ? 'bg-[var(--cl-primary)] text-slate-950 scale-[1.02]'
                  : 'bg-[var(--cl-surface-900)] text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)]'
              }`}
            >
              <Trophy className="w-4 h-4" /> Tournaments & Brackets
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'leaderboard'
                  ? 'bg-[var(--cl-primary)] text-slate-950 scale-[1.02]'
                  : 'bg-[var(--cl-surface-900)] text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)]'
              }`}
            >
              <Award className="w-4 h-4" /> Global Leaderboards
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
                              disabled={(selectedTournament.participants?.length || 0) >= selectedTournament.max_players}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--cl-primary)] text-slate-950 hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-[var(--cl-primary)]/20 disabled:opacity-50"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Join Tournament ({selectedTournament.participants?.length || 0}/{selectedTournament.max_players})
                            </button>
                          )}

                          {(selectedTournament.creator_id === user?.id || user?.role === 'admin' || user?.role === 'superadmin') && (
                            <>
                              <button
                                onClick={() => handleStartTournament(selectedTournament.id)}
                                disabled={(selectedTournament.participants?.length || 0) < 2}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" /> Start & Pair Bracket
                              </button>
                              <button
                                onClick={() => handleDeleteTournament(selectedTournament.id, false)}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                                title="Delete Tournament"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </>
                          )}
                        </>
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
                                {t.status === 'registration' ? 'Open for Joining' : t.status === 'in_progress' ? 'Matches In Progress' : 'Completed'}
                              </span>
                              <h3 className="text-base font-extrabold text-[var(--cl-text-primary)] group-hover:text-[var(--cl-primary-light)] transition-colors">
                                {t.title}
                              </h3>
                              {t.description && (
                                <p className="text-xs text-[var(--cl-text-secondary)] mt-1 line-clamp-2 italic font-medium">
                                  "{t.description}"
                                </p>
                              )}
                            </div>
                            <Trophy className="w-6 h-6 text-amber-400 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                          </div>

                          <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-[var(--cl-surface-950)] rounded-xl border border-[var(--cl-border)]/50 text-[11px]">
                            <div>
                              <span className="text-[var(--cl-text-muted)] block text-[9px]">Players</span>
                              <span className="font-bold text-[var(--cl-text-primary)]">
                                {t.participants?.length || 0} / {t.max_players}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--cl-text-muted)] block text-[9px]">Time</span>
                              <span className="font-bold text-[var(--cl-text-primary)]">{t.time_control} mins</span>
                            </div>
                            <div>
                              <span className="text-[var(--cl-text-muted)] block text-[9px]">Type</span>
                              <span className="font-bold text-[var(--cl-text-primary)] capitalize">{t.type}</span>
                            </div>
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
        </div>

        {/* Right 1-Column Persistent Sidebar */}
        <div className="hidden lg:flex flex-col space-y-4 sticky top-0 self-start h-[calc(100vh-6.5rem)] max-h-[calc(100vh-6.5rem)] overflow-hidden pt-0.5 pb-4">
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
