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
import { Swords, Trophy, Users } from 'lucide-react';
import { useDialog } from '../utils/useDialog';
import { ChessWelcomeBanner } from '../components/chess/ChessWelcomeBanner';
import { AvailableMatchRoomsCard } from '../components/chess/AvailableMatchRoomsCard';
import { ChessLeaderboardCard } from '../components/chess/ChessLeaderboardCard';
import { OnlinePlayersCard } from '../components/chess/OnlinePlayersCard';
import { LobbyMessageHubCard } from '../components/chess/LobbyMessageHubCard';
import { CreateMatchModal } from '../components/chess/CreateMatchModal';
import { MobileCommunityDrawer } from '../components/chess/MobileCommunityDrawer';

export default function ChessHub() {
  const { user } = useAuth();
  const { showAlert } = useDialog();
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
              onClick={() => setActiveTab('lobby')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'lobby'
                  ? 'bg-[var(--cl-primary)] text-slate-950 scale-[1.02]'
                  : 'bg-[var(--cl-surface-900)] text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)]'
              }`}
            >
              <Swords className="w-4 h-4" /> Match Lobby & Chat
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'leaderboard'
                  ? 'bg-[var(--cl-primary)] text-slate-950 scale-[1.02]'
                  : 'bg-[var(--cl-surface-900)] text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)]'
              }`}
            >
              <Trophy className="w-4 h-4" /> Global Leaderboards
            </button>
          </div>

          {/* Active Tab Content */}
          {activeTab === 'lobby' ? (
            <AvailableMatchRoomsCard
              games={games}
              loading={loading}
              currentUserId={user?.id}
              copiedCode={copiedCode}
              onCopyInviteLink={copyInviteLink}
              onNavigateGame={(code) => navigate(`/app/chess/game/${code}`)}
              onOpenCreateModal={() => setShowCreateModal(true)}
            />
          ) : (
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
    </div>
  );
}
