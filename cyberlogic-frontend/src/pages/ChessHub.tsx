import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { useChessRealtime } from '../hooks/useChessRealtime';
import {
  fetchChessGames,
  createChessGame,
  fetchChessLeaderboard,
  fetchUserChessStats,
  fetchLobbyMessages,
  sendLobbyMessage,
  type ChessGame,
  type ChessPlayerStat,
  type ChessLobbyChatMessage,
} from '../utils/chessApi';
import {
  Trophy,
  Swords,
  Users,
  Shield,
  Clock,
  Send,
  Plus,
  Radio,
  Award,
  Link as LinkIcon,
  Check,
  Zap,
  Globe,
  MessageSquare,
  X,
  Loader2,
} from 'lucide-react';

export default function ChessHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { onlineUsers } = useWebSocket();
  const { lobbyMessages: wsLobbyMessages, sendLobbyChat, latestGameUpdate } = useChessRealtime();

  const [games, setGames] = useState<ChessGame[]>([]);
  const [leaderboard, setLeaderboard] = useState<ChessPlayerStat[]>([]);
  const [userStat, setUserStat] = useState<ChessPlayerStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lobby' | 'leaderboard'>('lobby');
  const [leaderboardSort, setLeaderboardSort] = useState<'elo' | 'reputation'>('elo');

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
      const [gamesList, lbData, myStats] = await Promise.all([
        fetchChessGames(),
        fetchChessLeaderboard(leaderboardSort),
        fetchUserChessStats(),
      ]);
      setGames(gamesList);
      setLeaderboard(lbData);
      setUserStat(myStats);
    } catch (err) {
      console.error('[ChessHub] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [leaderboardSort]);

  // Load initial lobby messages from 7-day retention DB
  useEffect(() => {
    fetchLobbyMessages()
      .then((data) => {
        setMessages(data.messages);
        setHasMoreMessages(data.has_more);
        // Scroll to bottom on initial load
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

      // Auto-scroll to bottom if user is near bottom
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

        // Maintain scroll offset after prepending older messages
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

  // Listen for real-time game room updates
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

  const handleCreateGame = async (targetInviteeId?: number) => {
    setCreating(true);
    try {
      const newGame = await createChessGame({
        type: gameType,
        time_control: timeControl === 0 ? null : timeControl,
        allow_spectators: allowSpectators,
        color_preference: colorPref,
        invitee_id: targetInviteeId || null,
      });

      setShowCreateModal(false);
      setShowMobileDrawer(false);
      setChallengingUserId(null);
      navigate(`/app/chess/game/${newGame.game_code}`);
    } catch (err) {
      console.error('[ChessHub] Failed to create game:', err);
      alert('Could not create game room. Please try again.');
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
      // Fallback WS dispatch
      sendLobbyChat(textToSend);
    }
  };

  const copyInviteLink = (gameCode: string) => {
    const url = `${window.location.origin}/app/chess/game/${gameCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(gameCode);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6 text-[var(--cl-text-primary)] font-sans relative">
      {/* Top Level 3-Column Layout Grid (Matching Dashboard Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Main Column (2-Columns Width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Header Banner (Dashboard Banner Style) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--cl-primary)]/10 via-[var(--cl-accent)]/5 to-transparent border border-[var(--cl-border)] p-6 sm:p-8 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--cl-primary)]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--cl-primary-glow)] text-[var(--cl-primary-light)] text-xs font-semibold rounded-full border border-[var(--cl-primary)]/30 mb-3">
                  <Swords className="w-3.5 h-3.5" /> 1v1 Realtime Arena
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-heading)] text-[var(--cl-text-primary)] mb-2">
                  Welcome to <span className="text-gradient">Chess Arena</span>, {user?.first_name || user?.name || 'Member'}!
                </h1>
                <p className="text-xs sm:text-sm text-[var(--cl-text-muted)] max-w-lg leading-relaxed">
                  Challenge club members in 1v1 ranked or casual matches. Earn ELO rating for the leaderboard and Reputation Points for participation!
                </p>
              </div>

              {/* User Stats Card & Action Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3.5 w-full md:w-auto">
                {userStat && (
                  <div className="bg-[var(--cl-surface-900)]/80 backdrop-blur border border-[var(--cl-border)] rounded-xl px-4 py-2.5 flex items-center justify-around sm:justify-center gap-5 w-full sm:w-auto">
                    <div className="text-center">
                      <div className="text-[11px] text-[var(--cl-text-muted)] font-medium uppercase tracking-wider flex items-center justify-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" /> ELO
                      </div>
                      <div className="text-lg font-extrabold text-amber-400 mt-0.5">{userStat.elo_rating}</div>
                    </div>
                    <div className="h-7 w-px bg-[var(--cl-border)]"></div>
                    <div className="text-center">
                      <div className="text-[11px] text-[var(--cl-text-muted)] font-medium uppercase tracking-wider flex items-center justify-center gap-1">
                        <Award className="w-3.5 h-3.5 text-emerald-400" /> Rep
                      </div>
                      <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                        +{userStat.chess_reputation_points}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[var(--cl-primary)] hover:brightness-110 active:scale-95 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Plus className="w-4 h-4" /> Create Match
                </button>
              </div>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <div className="sticky top-[76px] z-20 bg-[var(--cl-surface-950)]/90 backdrop-blur-md pt-2 pb-1 flex items-center border-b border-[var(--cl-border)] overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('lobby')}
              className={`px-4 sm:px-5 py-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'lobby'
                  ? 'border-[var(--cl-primary)] text-[var(--cl-primary)] bg-[var(--cl-primary-glow)] rounded-t-lg'
                  : 'border-transparent text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)]'
              }`}
            >
              <Swords className="w-4 h-4" /> Match Lobby & Chat
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 sm:px-5 py-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'leaderboard'
                  ? 'border-[var(--cl-primary)] text-[var(--cl-primary)] bg-[var(--cl-primary-glow)] rounded-t-lg'
                  : 'border-transparent text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)]'
              }`}
            >
              <Trophy className="w-4 h-4" /> Global Leaderboards
            </button>
          </div>

          {/* Active Tab Content */}
          {activeTab === 'lobby' ? (
            /* Available Match Rooms Card */
            <div className="glass border border-[var(--cl-border)] rounded-2xl p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--cl-text-primary)] font-[family-name:var(--font-heading)]">
                  <Radio className="w-5 h-5 text-emerald-400 animate-pulse" /> Available Match Rooms
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--cl-surface-800)] text-[var(--cl-text-secondary)] border border-[var(--cl-border)]">
                  {games.length} active
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-[var(--cl-text-muted)]">Loading games...</div>
              ) : games.length === 0 ? (
                <div className="py-12 text-center bg-[var(--cl-surface-950)]/50 rounded-xl border border-dashed border-[var(--cl-border)]">
                  <Swords className="w-10 h-10 text-[var(--cl-text-muted)] mx-auto mb-2 opacity-50" />
                  <p className="text-[var(--cl-text-secondary)] font-medium">No open game rooms right now.</p>
                  <p className="text-[var(--cl-text-muted)] text-xs mt-1">Create one to invite someone or wait for players!</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 bg-[var(--cl-primary)] text-slate-950 text-xs font-bold px-4 py-2 rounded-lg transition-all hover:brightness-110"
                  >
                    Create Game Room
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {games.map((g) => {
                    const isFull = g.status === 'in_progress' || (g.white_player_id && g.black_player_id);
                    const isMyGame = user && (g.white_player_id === user.id || g.black_player_id === user.id || g.host_player_id === user.id);

                    return (
                      <div
                        key={g.id}
                        className="bg-[var(--cl-surface-950)]/80 border border-[var(--cl-border)]/60 hover:border-[var(--cl-primary)]/50 rounded-xl p-4 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                g.type === 'ranked'
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              }`}
                            >
                              {g.type}
                            </span>

                            <div className="flex items-center gap-2">
                              {g.allow_spectators ? (
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/20">
                                  <Globe className="w-3 h-3" /> Spectators Allowed
                                </span>
                              ) : (
                                <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-rose-500/20">
                                  <Shield className="w-3 h-3" /> Private Match
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Players summary */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-xs bg-[var(--cl-surface-900)] px-3 py-1.5 rounded-lg border border-[var(--cl-border)]">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400"></div>
                                <span className="font-semibold text-[var(--cl-text-primary)]">
                                  {g.white_player?.name || g.white_player?.username || (g.white_player_id ? `User #${g.white_player_id}` : 'Waiting...')}
                                </span>
                              </div>
                              <span className="text-[var(--cl-text-muted)] font-mono text-[10px]">WHITE</span>
                            </div>

                            <div className="flex items-center justify-between text-xs bg-[var(--cl-surface-900)] px-3 py-1.5 rounded-lg border border-[var(--cl-border)]">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-600"></div>
                                <span className="font-semibold text-[var(--cl-text-primary)]">
                                  {g.black_player?.name || g.black_player?.username || (g.black_player_id ? `User #${g.black_player_id}` : 'Waiting...')}
                                </span>
                              </div>
                              <span className="text-[var(--cl-text-muted)] font-mono text-[10px]">BLACK</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[var(--cl-border)]">
                          <div className="text-[11px] text-[var(--cl-text-muted)] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {g.time_control ? `${g.time_control} min` : 'Untimed'}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyInviteLink(g.game_code)}
                              title="Copy Invite Link"
                              className="p-2 text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)] bg-[var(--cl-surface-800)] hover:bg-[var(--cl-surface-700)] rounded-lg transition-all cursor-pointer border border-[var(--cl-border)]"
                            >
                              {copiedCode === g.game_code ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => navigate(`/app/chess/game/${g.game_code}`)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                isMyGame
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : isFull
                                  ? 'bg-[var(--cl-surface-800)] hover:bg-[var(--cl-surface-700)] text-[var(--cl-text-primary)] border border-[var(--cl-border)]'
                                  : 'bg-[var(--cl-primary)] hover:brightness-110 text-slate-950'
                              }`}
                            >
                              {isMyGame ? 'Rejoin Room' : isFull ? 'Watch Match' : 'Join Match'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Global Leaderboards Card */
            <div className="glass border border-[var(--cl-border)] rounded-2xl p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[var(--cl-text-primary)] font-[family-name:var(--font-heading)] flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-400" /> CyberLogic Chess Leaderboard
                  </h2>
                  <p className="text-xs text-[var(--cl-text-muted)] mt-0.5">Top players ranked by ELO Rating and Participation Reputation</p>
                </div>

                <div className="flex items-center gap-2 bg-[var(--cl-surface-950)] p-1 rounded-xl border border-[var(--cl-border)] self-start sm:self-auto">
                  <button
                    onClick={() => setLeaderboardSort('elo')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      leaderboardSort === 'elo'
                        ? 'bg-[var(--cl-primary)] text-slate-950 font-bold shadow'
                        : 'text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)]'
                    }`}
                  >
                    Ranked ELO
                  </button>
                  <button
                    onClick={() => setLeaderboardSort('reputation')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      leaderboardSort === 'reputation'
                        ? 'bg-[var(--cl-primary)] text-slate-950 font-bold shadow'
                        : 'text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)]'
                    }`}
                  >
                    Reputation Points
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[var(--cl-text-primary)]">
                  <thead className="bg-[var(--cl-surface-950)] text-[var(--cl-text-muted)] uppercase text-[11px] tracking-wider font-semibold border-b border-[var(--cl-border)]">
                    <tr>
                      <th className="px-3.5 py-3">Rank</th>
                      <th className="px-3.5 py-3">Player</th>
                      <th className="px-3.5 py-3">ELO Rating</th>
                      <th className="px-3.5 py-3">Peak ELO</th>
                      <th className="px-3.5 py-3">Ranked Record (W/L/D)</th>
                      <th className="px-3.5 py-3">Reputation Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--cl-border)]">
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[var(--cl-text-muted)] italic">
                          No leaderboard entries yet. Play a match to get ranked!
                        </td>
                      </tr>
                    ) : (
                      leaderboard.map((stat, index) => {
                        const rank = index + 1;
                        return (
                          <tr key={stat.id} className="hover:bg-[var(--cl-surface-800)]/40 transition-colors">
                            <td className="px-3.5 py-3 font-bold text-[var(--cl-text-muted)]">
                              {rank === 1 ? (
                                <span className="text-amber-400 text-base">🥇 #1</span>
                              ) : rank === 2 ? (
                                <span className="text-slate-300 text-base">🥈 #2</span>
                              ) : rank === 3 ? (
                                <span className="text-amber-700 text-base">🥉 #3</span>
                              ) : (
                                `#${rank}`
                              )}
                            </td>
                            <td className="px-3.5 py-3">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={
                                    stat.user?.avatar ||
                                    `https://api.dicebear.com/9.x/avataaars/svg?seed=${stat.user_id}`
                                  }
                                  alt="avatar"
                                  className="w-7 h-7 rounded-full border border-[var(--cl-border)] object-cover"
                                />
                                <div>
                                  <div className="font-semibold text-[var(--cl-text-primary)] text-xs sm:text-sm">
                                    {stat.user?.name || stat.user?.username || `Player #${stat.user_id}`}
                                  </div>
                                  <div className="text-[10px] text-[var(--cl-text-muted)] capitalize">{stat.user?.role || 'member'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3.5 py-3 font-extrabold text-amber-400 font-mono text-sm sm:text-base">
                              {stat.elo_rating}
                            </td>
                            <td className="px-3.5 py-3 text-[var(--cl-text-muted)] font-mono text-xs">{stat.peak_elo}</td>
                            <td className="px-3.5 py-3 text-xs font-mono text-[var(--cl-text-secondary)] whitespace-nowrap">
                              <span className="text-emerald-400 font-bold">{stat.ranked_wins}W</span> /{' '}
                              <span className="text-rose-400 font-bold">{stat.ranked_losses}L</span> /{' '}
                              <span className="text-[var(--cl-text-muted)]">{stat.ranked_draws}D</span>
                            </td>
                            <td className="px-3.5 py-3 font-bold text-emerald-400 font-mono text-xs sm:text-sm">
                              +{stat.chess_reputation_points}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
               {/* Right 1-Column Persistent Sidebar (Online Players & Lobby Chat Hub) - Responsive & Overflow-Proof */}
        <div className="hidden lg:flex flex-col space-y-3.5 sticky top-[76px] self-start h-[calc(100vh-100px)] max-h-[calc(100vh-100px)] overflow-hidden">
          {/* Online Players Card */}
          <div className="glass border border-[var(--cl-border)] rounded-2xl p-3.5 shadow-xl flex flex-col flex-1 min-h-[130px] max-h-[42%] overflow-hidden">
            <div className="flex items-center justify-between gap-1 mb-2.5 shrink-0">
              <h2 className="text-xs sm:text-sm font-bold text-[var(--cl-text-primary)] font-[family-name:var(--font-heading)] flex items-center gap-1.5 truncate">
                <Users className="w-3.5 h-3.5 text-[var(--cl-primary)] shrink-0" /> Online Club Players
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--cl-primary-glow)] text-[var(--cl-primary-light)] border border-[var(--cl-primary)]/30 shrink-0 whitespace-nowrap">
                {onlineUsers.length} online
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {onlineUsers.length === 0 ? (
                <div className="text-xs text-[var(--cl-text-muted)] py-6 text-center italic">No other players online</div>
              ) : (
                onlineUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-1.5 sm:p-2 rounded-xl bg-[var(--cl-surface-950)]/70 hover:bg-[var(--cl-surface-950)] border border-[var(--cl-border)]/60 text-xs transition-all gap-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.id}`}
                          alt={u.name}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-[var(--cl-border)]/80"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[var(--cl-surface-950)] ${
                            u.status === 'playing' ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                        ></span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[var(--cl-text-primary)] truncate text-[11px] sm:text-xs">{u.name}</div>
                        <div className="text-[9px] sm:text-[10px] text-[var(--cl-text-muted)] capitalize truncate">{u.status || 'online'}</div>
                      </div>
                    </div>

                    {user && user.id !== u.id && (
                      <button
                        onClick={() => {
                          setChallengingUserId(u.id);
                          setShowCreateModal(true);
                        }}
                        title="Challenge Player"
                        className="bg-[var(--cl-primary)]/15 hover:bg-[var(--cl-primary)]/30 text-[var(--cl-primary-light)] border border-[var(--cl-primary)]/30 rounded-lg text-[10px] sm:text-xs font-semibold px-2 py-1 flex items-center gap-1 transition-all cursor-pointer shrink-0"
                      >
                        <Zap className="w-3 h-3" />
                        <span className="hidden xl:inline">Challenge</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lobby Message Hub Card (7-day Retention + Backreading) */}
          <div className="glass border border-[var(--cl-border)] rounded-2xl p-3.5 shadow-xl flex flex-col flex-1 min-h-[220px] overflow-hidden">
            <div className="flex items-center justify-between gap-1 mb-2 shrink-0">
              <h2 className="text-xs sm:text-sm font-bold text-[var(--cl-text-primary)] font-[family-name:var(--font-heading)] flex items-center gap-1.5 truncate">
                <Globe className="w-3.5 h-3.5 text-[var(--cl-primary)] shrink-0" /> Lobby Message Hub
              </h2>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono text-[var(--cl-text-muted)] bg-[var(--cl-surface-950)] border border-[var(--cl-border)] shrink-0 whitespace-nowrap">
                7-day retention
              </span>
            </div>

            <div
              ref={desktopChatRef}
              onScroll={() => handleScrollBackread(desktopChatRef)}
              className="flex-1 overflow-y-auto space-y-1.5 mb-2 pr-1 text-xs custom-scrollbar relative min-h-0"
            >
              {loadingMoreMessages && (
                <div className="py-1 text-center text-[var(--cl-primary)] text-[10px] flex items-center justify-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading older messages...
                </div>
              )}

              {messages.length === 0 ? (
                <div className="text-[var(--cl-text-muted)] text-center py-8 text-xs italic">
                  No messages yet. Say hello in the chess lobby!
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={msg.id || i}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[var(--cl-surface-950)]/80 border border-[var(--cl-border)]/50 hover:border-[var(--cl-primary)]/40 transition-all gap-1.5"
                  >
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <span className="font-bold text-[var(--cl-primary-light)] shrink-0 text-[10px] sm:text-[11px]">
                        {msg.sender?.name || 'Player'}:
                      </span>
                      <span className="text-[var(--cl-text-primary)] truncate font-normal text-[10px] sm:text-[11px]">
                        {msg.text}
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-[var(--cl-text-muted)] font-mono shrink-0 text-right">
                      {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-1.5 shrink-0 pt-2 border-t border-[var(--cl-border)]/40">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type message..."
                className="flex-1 min-w-0 bg-[var(--cl-surface-950)] border border-[var(--cl-border)] text-xs text-[var(--cl-text-primary)] rounded-xl px-3 py-2 focus:outline-none focus:border-[var(--cl-primary)] transition-all"
              />
              <button
                type="submit"
                className="bg-[var(--cl-primary)] hover:brightness-110 active:scale-95 text-slate-950 font-extrabold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-[var(--cl-primary-glow)] flex items-center justify-center gap-1 shrink-0 text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
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
      {showMobileDrawer && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="bg-[var(--cl-surface-900)] border-l border-[var(--cl-border)] w-full max-w-sm h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Slideout Header */}
            <div className="p-4 border-b border-[var(--cl-border)] flex items-center justify-between bg-[var(--cl-surface-950)]">
              <h3 className="font-bold text-sm text-[var(--cl-text-primary)] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--cl-primary)]" /> Chess Community Hub
              </h3>
              <button
                onClick={() => setShowMobileDrawer(false)}
                className="p-1 text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slideout Tabs */}
            <div className="flex border-b border-[var(--cl-border)] bg-[var(--cl-surface-950)]">
              <button
                onClick={() => setMobileDrawerTab('players')}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  mobileDrawerTab === 'players'
                    ? 'border-[var(--cl-primary)] text-[var(--cl-primary)] bg-[var(--cl-primary-glow)]'
                    : 'border-transparent text-[var(--cl-text-muted)]'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Online Players ({onlineUsers.length})
              </button>
              <button
                onClick={() => setMobileDrawerTab('chat')}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  mobileDrawerTab === 'chat'
                    ? 'border-[var(--cl-primary)] text-[var(--cl-primary)] bg-[var(--cl-primary-glow)]'
                    : 'border-transparent text-[var(--cl-text-muted)]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Lobby Chat
              </button>
            </div>

            {/* Slideout Body */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {mobileDrawerTab === 'players' ? (
                <div className="space-y-2">
                  {onlineUsers.length === 0 ? (
                    <div className="text-xs text-[var(--cl-text-muted)] py-8 text-center">
                      No other players online
                    </div>
                  ) : (
                    onlineUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--cl-surface-950)] border border-[var(--cl-border)] text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <img
                              src={u.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.id}`}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-[var(--cl-border)]"
                            />
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[var(--cl-surface-950)] ${
                                u.status === 'playing' ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                            ></span>
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--cl-text-primary)]">{u.name}</div>
                            <div className="text-[10px] text-[var(--cl-text-muted)] capitalize">{u.status || 'online'}</div>
                          </div>
                        </div>

                        {user && user.id !== u.id && (
                          <button
                            onClick={() => {
                              setChallengingUserId(u.id);
                              setShowCreateModal(true);
                            }}
                            className="bg-[var(--cl-primary)] text-slate-950 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1 transition-all hover:brightness-110 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" /> Challenge
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div
                    ref={mobileChatRef}
                    onScroll={() => handleScrollBackread(mobileChatRef)}
                    className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 text-xs custom-scrollbar min-h-[300px] relative"
                  >
                    {loadingMoreMessages && (
                      <div className="py-2 text-center text-[var(--cl-primary)] text-[10px] flex items-center justify-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading older messages...
                      </div>
                    )}

                    {messages.length === 0 ? (
                      <div className="text-[var(--cl-text-muted)] text-center py-12 text-xs">
                        No messages yet. Say hello in the chess lobby!
                      </div>
                    ) : (
                      messages.map((msg, i) => (
                        <div
                          key={msg.id || i}
                          className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[var(--cl-surface-950)] border border-[var(--cl-border)]/60 transition-all gap-2"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="font-bold text-[var(--cl-primary-light)] shrink-0 text-[11px]">
                              {msg.sender?.name || 'Player'}:
                            </span>
                            <span className="text-[var(--cl-text-primary)] truncate font-normal text-[11px]">
                              {msg.text}
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--cl-text-muted)] font-mono shrink-0 text-right ml-1">
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-[var(--cl-border)]">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type message in lobby..."
                      className="flex-1 bg-[var(--cl-surface-950)] border border-[var(--cl-border)] text-xs text-[var(--cl-text-primary)] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[var(--cl-primary)]"
                    />
                    <button
                      type="submit"
                      className="bg-[var(--cl-primary)] text-slate-950 font-bold p-2.5 rounded-lg transition-all hover:brightness-110 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Match Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 text-[var(--cl-text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--cl-border)] pb-3">
              <h3 className="text-lg font-bold text-[var(--cl-text-primary)] flex items-center gap-2">
                <Swords className="w-5 h-5 text-[var(--cl-primary)]" /> Create 1v1 Chess Match
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Mode Selection */}
            <div>
              <label className="text-xs font-bold text-[var(--cl-text-muted)] uppercase tracking-wider block mb-2">
                Match Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGameType('ranked')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    gameType === 'ranked'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                      : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)] text-[var(--cl-text-secondary)] hover:border-[var(--cl-primary)]/40'
                  }`}
                >
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" /> Ranked
                  </div>
                  <div className="text-[11px] text-[var(--cl-text-muted)] mt-1">Affects ELO rating & gives +3/+1 Reputation</div>
                </button>

                <button
                  type="button"
                  onClick={() => setGameType('casual')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    gameType === 'casual'
                      ? 'bg-blue-500/10 border-blue-500 text-blue-300'
                      : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)] text-[var(--cl-text-secondary)] hover:border-[var(--cl-primary)]/40'
                  }`}
                >
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-400" /> Casual
                  </div>
                  <div className="text-[11px] text-[var(--cl-text-muted)] mt-1">Practice match. Gives +3/+1 Reputation</div>
                </button>
              </div>
            </div>

            {/* Time Control */}
            <div>
              <label className="text-xs font-bold text-[var(--cl-text-muted)] uppercase tracking-wider block mb-2">
                Time Control (Minutes per player)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 10, 0].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTimeControl(mins)}
                    className={`py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      timeControl === mins
                        ? 'bg-[var(--cl-primary)] border-[var(--cl-primary)] text-slate-950 font-bold'
                        : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)] text-[var(--cl-text-secondary)] hover:border-[var(--cl-primary)]/40'
                    }`}
                  >
                    {mins === 0 ? 'Untimed' : `${mins} min`}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Preference */}
            <div>
              <label className="text-xs font-bold text-[var(--cl-text-muted)] uppercase tracking-wider block mb-2">
                Color Choice
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['white', 'black', 'random'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorPref(c)}
                    className={`py-2 rounded-lg border text-xs font-bold capitalize transition-all cursor-pointer ${
                      colorPref === c
                        ? 'bg-[var(--cl-primary)] border-[var(--cl-primary)] text-slate-950 font-bold'
                        : 'bg-[var(--cl-surface-950)] border-[var(--cl-border)] text-[var(--cl-text-secondary)] hover:border-[var(--cl-primary)]/40'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Spectator Toggle Switch */}
            <div className="flex items-center justify-between p-3 bg-[var(--cl-surface-950)] rounded-xl border border-[var(--cl-border)]">
              <div>
                <div className="text-xs font-bold text-[var(--cl-text-primary)]">Allow Spectators</div>
                <div className="text-[11px] text-[var(--cl-text-muted)]">Other club members can watch match live</div>
              </div>
              <input
                type="checkbox"
                checked={allowSpectators}
                onChange={(e) => setAllowSpectators(e.target.checked)}
                className="w-5 h-5 accent-[var(--cl-primary)] cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-[var(--cl-surface-800)] hover:bg-[var(--cl-surface-700)] text-[var(--cl-text-secondary)] text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer border border-[var(--cl-border)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={() => handleCreateGame(challengingUserId || undefined)}
                className="flex-1 bg-[var(--cl-primary)] hover:brightness-110 disabled:opacity-50 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
              >
                {creating ? 'Creating...' : 'Start Match'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
