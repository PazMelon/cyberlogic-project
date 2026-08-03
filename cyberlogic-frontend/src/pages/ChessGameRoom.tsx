import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { Chess, type Square, type Color } from 'chess.js';
import { useAuth } from '../context/AuthContext';
import { useChessRealtime } from '../hooks/useChessRealtime';
import { useDialog } from '../utils/useDialog';
import {
  fetchChessGame,
  joinChessGame,
  makeChessMove,
  resignChessGame,
  offerChessDraw,
  type ChessGame,
} from '../utils/chessApi';
import {
  Swords,
  Trophy,
  Flag,
  Handshake,
  Send,
  Link as LinkIcon,
  Check,
  ShieldAlert,
  ArrowLeft,
  Clock,
  Volume2,
  AlertTriangle,
  Award,
  Users,
  Eye,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  History,
} from 'lucide-react';

// Unicode chess piece glyphs for high resolution crisp rendering
const PIECE_UNICODE: Record<string, string> = {
  wP: '♙',
  wN: '♘',
  wB: '♗',
  wR: '♖',
  wQ: '♕',
  wK: '♔',
  bP: '♟',
  bN: '♞',
  bB: '♝',
  bR: '♜',
  bQ: '♛',
  bK: '♚',
};

export default function ChessGameRoom() {
  const { gameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReplayMode = searchParams.get('mode') === 'replay';
  const { user } = useAuth();
  const { showAlert, showConfirm } = useDialog();

  const [game, setGame] = useState<ChessGame | null>(null);
  const [isPlayer, setIsPlayer] = useState(false);
  const [spectatorBlocked, setSpectatorBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSpectatorsModal, setShowSpectatorsModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(!isReplayMode);

  // Replay mode state
  const [replayStep, setReplayStep] = useState<number | null>(null);
  const [isPlayingReplay, setIsPlayingReplay] = useState(false);

  // Chess.js instance
  const chessRef = useRef<Chess>(new Chess());
  const [boardVersion, setBoardVersion] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);

  // Timers
  const [whiteMs, setWhiteMs] = useState<number>(0);
  const [blackMs, setBlackMs] = useState<number>(0);

  // Chat message input & move log refs
  const [chatInput, setChatInput] = useState('');
  const moveHistoryRef = useRef<HTMLDivElement>(null);

  // Realtime hook
  const {
    gameMessages,
    spectatorMessages,
    latestGameUpdate,
    latestMove,
    drawOfferState,
    roomUsers,
    sendGameChat,
    sendSpectatorChat,
    sendDrawOffer,
  } = useChessRealtime(game?.id);

  // Load initial game state
  useEffect(() => {
    if (!gameCode) return;

    setLoading(true);
    fetchChessGame(gameCode)
      .then((data) => {
        setGame(data.game);
        setIsPlayer(data.is_player);

        if (data.game.pgn) {
          try {
            chessRef.current.loadPgn(data.game.pgn);
          } catch (e) {
            if (data.game.fen) chessRef.current.load(data.game.fen);
          }
          setBoardVersion((v) => v + 1);
        } else if (data.game.fen) {
          chessRef.current.load(data.game.fen);
          setBoardVersion((v) => v + 1);
        }

        if (data.game.white_time_left_ms) setWhiteMs(data.game.white_time_left_ms);
        if (data.game.black_time_left_ms) setBlackMs(data.game.black_time_left_ms);

        if (isReplayMode) {
          setReplayStep(0);
          setShowGameOverModal(false);
        }
      })
      .catch((err) => {
        console.error('[ChessGameRoom] Fetch error:', err);
        if (err.message.includes('Spectators')) {
          setSpectatorBlocked(true);
        }
      })
      .finally(() => setLoading(false));
  }, [gameCode]);

  // Handle incoming live move broadcast
  useEffect(() => {
    if (latestMove) {
      if (latestMove.pgn) {
        try {
          chessRef.current.loadPgn(latestMove.pgn);
        } catch (e) {
          if (latestMove.fen) chessRef.current.load(latestMove.fen);
        }
      } else if (latestMove.fen) {
        chessRef.current.load(latestMove.fen);
      }
      setBoardVersion((v) => v + 1);

      if (latestMove.white_time_left_ms !== undefined) setWhiteMs(latestMove.white_time_left_ms);
      if (latestMove.black_time_left_ms !== undefined) setBlackMs(latestMove.black_time_left_ms);

      setGame((prev) => (prev ? { ...prev, current_turn: latestMove.current_turn, fen: latestMove.fen, pgn: latestMove.pgn || prev.pgn } : null));
    }
  }, [latestMove]);

  // Handle latest game status updates & auto-boot on cancellation
  useEffect(() => {
    if (latestGameUpdate && game && latestGameUpdate.id === game.id) {
      setGame((prev) =>
        prev
          ? {
              ...prev,
              ...latestGameUpdate,
              white_player: latestGameUpdate.white_player || prev.white_player,
              black_player: latestGameUpdate.black_player || prev.black_player,
              host: latestGameUpdate.host || prev.host,
            }
          : latestGameUpdate
      );
      if (latestGameUpdate.pgn) {
        try {
          chessRef.current.loadPgn(latestGameUpdate.pgn);
        } catch (e) {
          if (latestGameUpdate.fen) chessRef.current.load(latestGameUpdate.fen);
        }
        setBoardVersion((v) => v + 1);
      } else if (latestGameUpdate.fen) {
        chessRef.current.load(latestGameUpdate.fen);
        setBoardVersion((v) => v + 1);
      }
    }
  }, [latestGameUpdate, game?.id]);

  // Auto boot/redirect players & spectators when game is cancelled
  useEffect(() => {
    if (!game) return;

    if (game.status === 'cancelled') {
      showAlert({
        title: 'Match / Tournament Cancelled',
        message: 'This match or tournament was cancelled by the host. Returning to Chess Arena...',
        type: 'warning',
      });
      const timeout = setTimeout(() => {
        bootUserBack();
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [game?.status, showAlert]);

  // Live Timer Interval
  useEffect(() => {
    if (!game || game.status !== 'in_progress' || !game.time_control) return;

    const timer = setInterval(() => {
      if (game.current_turn === 'white') {
        setWhiteMs((prev) => {
          if (prev <= 1000) {
            clearInterval(timer);
            handleTimeout('white');
            return 0;
          }
          return prev - 1000;
        });
      } else {
        setBlackMs((prev) => {
          if (prev <= 1000) {
            clearInterval(timer);
            handleTimeout('black');
            return 0;
          }
          return prev - 1000;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [game?.current_turn, game?.status]);

  const handleTimeout = async (timedOutColor: 'white' | 'black') => {
    if (!game || !user) return;
    const winnerId = timedOutColor === 'white' ? game.black_player_id : game.white_player_id;
    if (winnerId) {
      try {
        const updated = await makeChessMove(game.game_code, {
          fen: chessRef.current.fen(),
          game_over_reason: 'timeout',
          winner_id: winnerId,
        });
        setGame(updated);
      } catch (err) {
        console.error('Timeout handler error:', err);
      }
    }
  };

  const isMyTurn = useMemo(() => {
    if (!game || !user) return false;
    if (game.status !== 'in_progress') return false;
    const userId = Number(user.id);
    const whiteId = game.white_player_id ? Number(game.white_player_id) : null;
    const blackId = game.black_player_id ? Number(game.black_player_id) : null;

    if (game.current_turn === 'white' && whiteId === userId) return true;
    if (game.current_turn === 'black' && blackId === userId) return true;
    return false;
  }, [game, user]);

  const myColor = useMemo(() => {
    if (!game || !user) return 'white';
    const userId = Number(user.id);
    const whiteId = game.white_player_id ? Number(game.white_player_id) : null;
    const blackId = game.black_player_id ? Number(game.black_player_id) : null;

    if (blackId === userId && whiteId !== userId) return 'black';
    return 'white';
  }, [game, user]);

  const inCheck = useMemo(() => {
    return chessRef.current.inCheck();
  }, [boardVersion, game?.fen, latestMove]);

  const movePairs = useMemo(() => {
    const history = chessRef.current.history();
    const pairs: Array<{ turn: number; white: string; black?: string }> = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({
        turn: Math.floor(i / 2) + 1,
        white: history[i],
        black: history[i + 1],
      });
    }
    return pairs;
  }, [boardVersion, game?.pgn, latestMove]);

  // Extract list of all move SAN strings for replay
  const replayHistory = useMemo(() => {
    return chessRef.current.history();
  }, [boardVersion, game?.pgn, latestMove]);

  // Compute active chess instance for display (live or replay step position)
  const displayedChess = useMemo(() => {
    if (replayStep === null || replayStep < 0) {
      return chessRef.current;
    }
    const stepChess = new Chess();
    const historySAN = chessRef.current.history();
    const maxStep = Math.min(replayStep, historySAN.length);
    for (let i = 0; i < maxStep; i++) {
      try {
        stepChess.move(historySAN[i]);
      } catch (e) {
        console.error('[ChessReplay] Step move error:', historySAN[i], e);
      }
    }
    return stepChess;
  }, [replayStep, game?.pgn, boardVersion, latestMove]);

  // Compute active board grid from displayedChess
  const displayedBoard = useMemo(() => {
    return displayedChess.board();
  }, [displayedChess]);

  // Compute king check highlight for active displayed board position
  const checkedKingSquare = useMemo(() => {
    if (!displayedChess.inCheck()) return null;
    const turn = displayedChess.turn();
    const board = displayedChess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          const file = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][c];
          const rank = (8 - r).toString();
          return `${file}${rank}`;
        }
      }
    }
    return null;
  }, [displayedChess]);

  // Auto-play replay timer
  useEffect(() => {
    if (!isPlayingReplay) return;

    const interval = setInterval(() => {
      setReplayStep((prev) => {
        const current = prev === null ? replayHistory.length : prev;
        if (current >= replayHistory.length) {
          setIsPlayingReplay(false);
          return replayHistory.length;
        }
        return current + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlayingReplay, replayHistory.length]);

  useEffect(() => {
    if (moveHistoryRef.current) {
      moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight;
    }
  }, [movePairs]);

  // Square Click / Move Handler
  const handleSquareClick = (square: Square) => {
    if (replayStep !== null) {
      setReplayStep(null);
      setIsPlayingReplay(false);
    }
    if (!isMyTurn || !game || game.status !== 'in_progress') return;

    const chess = chessRef.current;

    // If square selected already, attempt move
    if (selectedSquare) {
      try {
        const move = chess.move({
          from: selectedSquare,
          to: square,
          promotion: 'q', // auto promote to queen for simplicity
        });

        if (move) {
          const newFen = chess.fen();
          setBoardVersion((v) => v + 1);
          setSelectedSquare(null);
          setPossibleMoves([]);

          // Check for game over conditions
          let reason: string | undefined = undefined;
          let winnerId: number | undefined = undefined;
          let isDraw = false;

          if (chess.isCheckmate()) {
            reason = 'checkmate';
            winnerId = chess.turn() === 'b' ? game.white_player_id! : game.black_player_id!;
          } else if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
            isDraw = true;
            reason = chess.isStalemate() ? 'stalemate' : 'draw';
          }

          // Submit move to backend API
          makeChessMove(game.game_code, {
            fen: newFen,
            pgn: chess.pgn(),
            move: move.san,
            white_time_left_ms: whiteMs,
            black_time_left_ms: blackMs,
            game_over_reason: reason,
            winner_id: winnerId,
            is_draw: isDraw,
          }).then((updated) => {
            setGame((prev) =>
              prev
                ? {
                    ...prev,
                    ...updated,
                    white_player: updated.white_player || prev.white_player,
                    black_player: updated.black_player || prev.black_player,
                    host: updated.host || prev.host,
                  }
                : updated
            );
          });

          return;
        }
      } catch (e) {
        // Invalid move, clear selection
      }
    }

    // Select piece if it belongs to current player turn
    const piece = chess.get(square);
    const expectedColor: Color = game.current_turn === 'white' ? 'w' : 'b';

    if (piece && piece.color === expectedColor) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setPossibleMoves(moves.map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const handleJoinGame = async () => {
    if (!gameCode) return;
    try {
      const updated = await joinChessGame(gameCode);
      setGame(updated);
      setIsPlayer(true);
    } catch (err) {
      showAlert({
        title: 'Join Error',
        message: 'Could not join match room.',
        type: 'error',
      });
    }
  };

  const handleResign = async () => {
    if (!game) return;
    const confirmed = await showConfirm({
      title: 'Resign Match?',
      message: 'Are you sure you want to resign this match? This will count as a loss.',
      type: 'danger',
      confirmText: 'Yes, Resign',
    });
    if (!confirmed) return;

    try {
      const updated = await resignChessGame(game.game_code);
      setGame(updated);
    } catch (err) {
      console.error('Resign error:', err);
    }
  };

  const handleDrawAction = async (action: 'offer' | 'accept' | 'decline') => {
    if (!game) return;
    try {
      sendDrawOffer(action);
      if (action === 'accept') {
        await offerChessDraw(game.game_code, 'accept');
      }
    } catch (err) {
      console.error('Draw offer error:', err);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (isPlayer) {
      sendGameChat(chatInput);
    } else {
      sendSpectatorChat(chatInput);
    }
    setChatInput('');
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatTime = (ms: number) => {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (spectatorBlocked) {
    return (
      <div className="min-h-screen bg-[var(--cl-surface-950)] text-[var(--cl-text-primary)] flex items-center justify-center p-4">
        <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-[var(--cl-text-primary)] mb-2">Spectator Access Restricted</h2>
          <p className="text-[var(--cl-text-secondary)] text-sm mb-6">
            The host disabled spectators for this match. Only the two playing participants can access the room.
          </p>
          <button
            onClick={() => navigate('/app/chess')}
            className="bg-[var(--cl-primary)] hover:brightness-110 text-slate-950 text-sm font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 mx-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Chess Hub
          </button>
        </div>
      </div>
    );
  }

  if (loading || !game) {
    return (
      <div className="min-h-screen bg-[var(--cl-surface-950)] text-[var(--cl-text-primary)] flex items-center justify-center">
        <div className="text-[var(--cl-text-secondary)] text-sm flex items-center gap-2">
          <Swords className="w-5 h-5 text-[var(--cl-primary)] animate-spin" /> Loading Chess Match...
        </div>
      </div>
    );
  }

  // Board grid layout (flip if playing black)
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayRanks = myColor === 'black' ? [...ranks].reverse() : ranks;
  const displayFiles = myColor === 'black' ? [...files].reverse() : files;

  const bootUserBack = () => {
    const tournamentId = (game as any)?.tournament_id || (game as any)?.tournament?.id;
    if (tournamentId) {
      navigate(`/app/chess?tab=tournaments&tournament=${tournamentId}`);
    } else {
      navigate('/app/chess?tab=lobby');
    }
  };

  const isReplay = isReplayMode || replayStep !== null || (game?.status === 'completed' && !showGameOverModal);

  return (
    <div className="space-y-6 text-[var(--cl-text-primary)] font-sans">
      {/* Top Header Card */}
      <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={bootUserBack}
            title={(game as any)?.tournament_id || (game as any)?.tournament?.id ? 'Back to Tournament Details' : 'Back to Match Lobby'}
            className="px-3 py-2 bg-[var(--cl-surface-950)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)] rounded-xl text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)] transition-all cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-semibold hidden sm:inline">
              {(game as any)?.tournament_id || (game as any)?.tournament?.id ? 'Tournament Details' : 'Match Lobby'}
            </span>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  game.type === 'ranked'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}
              >
                {game.type} match
              </span>
              <span className="text-xs font-mono text-[var(--cl-text-secondary)] bg-[var(--cl-surface-950)] px-2 py-0.5 rounded border border-[var(--cl-border)]">
                #{game.game_code}
              </span>
              {game.time_control && (
                <span className="text-[10px] font-mono text-[var(--cl-text-muted)] bg-[var(--cl-surface-950)] px-2 py-0.5 rounded border border-[var(--cl-border)] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {game.time_control}m
                </span>
              )}
              {inCheck && game.status === 'in_progress' && (
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" /> CHECK!
                </span>
              )}
              {game.status === 'completed' && game.win_reason === 'checkmate' && (
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                  <Swords className="w-3 h-3 text-amber-400" /> CHECKMATE!
                </span>
              )}
              {isReplay && (
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-amber-400" /> REPLAY MODE
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-lg sm:text-xl font-extrabold text-[var(--cl-text-primary)]">1v1 Chess Arena</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--cl-surface-950)] text-[var(--cl-primary-light)] border border-[var(--cl-border)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {game.allow_spectators ? 'Spectators Allowed' : 'Private Match'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
          {game.status === 'waiting' && user && game.host_player_id !== user.id && !isPlayer && (
            <button
              onClick={handleJoinGame}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Swords className="w-4 h-4" /> Join Match
            </button>
          )}

          <button
            onClick={copyInvite}
            className="bg-[var(--cl-surface-950)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-[var(--cl-text-primary)] text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4" />}
            {copiedLink ? 'Link Copied!' : 'Invite Link'}
          </button>

          {isPlayer && game.status === 'in_progress' && (
            <>
              <button
                onClick={() => handleDrawAction('offer')}
                className="bg-[var(--cl-surface-950)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-amber-400 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Handshake className="w-4 h-4" /> Draw
              </button>
              <button
                onClick={handleResign}
                className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Flag className="w-4 h-4" /> Resign
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Game Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Board & Player Cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Top Player Card (Black by default unless user is black) */}
          {(() => {
            const topPlayer = myColor === 'white' ? game.black_player : game.white_player;
            const topColor = myColor === 'white' ? 'black' : 'white';
            const topMs = topColor === 'white' ? whiteMs : blackMs;
            const isTurn = game.status === 'in_progress' && game.current_turn === topColor;

            return (
              <div
                className={`bg-[var(--cl-surface-900)] border p-3 rounded-2xl flex items-center justify-between transition-all ${
                  isTurn ? 'border-[var(--cl-primary)] ring-2 ring-[var(--cl-primary)]/30' : 'border-[var(--cl-border)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={topPlayer?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${topColor}`}
                      alt="avatar"
                      className="w-10 h-10 rounded-full border border-[var(--cl-border)] object-cover"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--cl-surface-900)] ${
                        topColor === 'white' ? 'bg-white' : 'bg-slate-900'
                      }`}
                    ></div>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[var(--cl-text-primary)]">
                      {topPlayer?.name || (topPlayer ? `User #${topPlayer.id}` : 'Waiting for Player...')}
                    </div>
                    <div className="text-xs text-[var(--cl-text-muted)] flex items-center gap-1.5 font-mono">
                      <span>{topPlayer?.username ? `@${topPlayer.username}` : topPlayer ? `@user_${topPlayer.id}` : 'Unassigned'}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-[var(--cl-surface-950)] border border-[var(--cl-border)] font-bold text-[var(--cl-text-secondary)]">
                        {topColor}
                      </span>
                    </div>
                  </div>
                </div>

                {game.time_control && (
                  <div
                    className={`font-mono text-lg font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 ${
                      isTurn ? 'bg-[var(--cl-primary)] text-slate-950 font-extrabold animate-pulse' : 'bg-[var(--cl-surface-950)] text-[var(--cl-text-muted)] border border-[var(--cl-border)]'
                    }`}
                  >
                    <Clock className="w-4 h-4" /> {formatTime(topMs)}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Interactive Chess Board */}
          <div
            className={`relative aspect-square max-w-[540px] mx-auto bg-[var(--cl-surface-900)] border-4 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
              isMyTurn
                ? 'border-[var(--cl-primary)] ring-4 ring-[var(--cl-primary)]/25 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
                : 'border-[var(--cl-border)]'
            }`}
          >
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
              {displayRanks.map((r, rIdx) =>
                displayFiles.map((f, fIdx) => {
                  const square = `${f}${r}` as Square;
                  const isDark = (files.indexOf(f) + ranks.indexOf(r)) % 2 === 1;

                  // Find piece on this square (from displayedBoard)
                  const rankNum = 8 - parseInt(r, 10);
                  const fileNum = files.indexOf(f);
                  const pieceObj = displayedBoard[rankNum]?.[fileNum];

                  const pieceKey = pieceObj ? `${pieceObj.color}${pieceObj.type.toUpperCase()}` : null;
                  const pieceSymbol = pieceKey ? PIECE_UNICODE[pieceKey] : null;

                  const isSelected = selectedSquare === square;
                  const isPossible = possibleMoves.includes(square);
                  const isCheckedKing = checkedKingSquare === square;

                  return (
                    <div
                      key={square}
                      onClick={() => handleSquareClick(square)}
                      className={`relative flex items-center justify-center text-4xl select-none cursor-pointer transition-colors ${
                        isCheckedKing
                          ? 'bg-rose-600/60 ring-4 ring-rose-500 shadow-[inset_0_0_20px_rgba(225,29,72,0.8)] animate-pulse z-20'
                          : isSelected
                          ? 'bg-[var(--cl-primary)]/40 ring-2 ring-[var(--cl-primary)] inset-0 z-10'
                          : isDark
                          ? 'bg-[var(--cl-surface-800)]/80 text-[var(--cl-text-primary)]'
                          : 'bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]'
                      }`}
                    >
                      {/* Rank/File Notation labels */}
                      {fIdx === 0 && (
                        <span className="absolute top-0.5 left-1 text-[9px] font-mono text-[var(--cl-text-muted)] opacity-60">
                          {r}
                        </span>
                      )}
                      {rIdx === 7 && (
                        <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-[var(--cl-text-muted)] opacity-60">
                          {f}
                        </span>
                      )}

                      {/* Possible move dot indicator */}
                      {isPossible && (
                        <div
                          className={`absolute z-20 rounded-full ${
                            pieceSymbol ? 'w-full h-full border-4 border-[var(--cl-primary)]/80 bg-[var(--cl-primary)]/20' : 'w-4 h-4 bg-[var(--cl-primary)]/80'
                          }`}
                        ></div>
                      )}

                      {/* Piece Glyph */}
                      {pieceSymbol && (
                        <span
                          className={`z-10 transition-transform duration-100 hover:scale-110 drop-shadow-md ${
                            pieceObj?.color === 'w'
                              ? 'text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                              : 'text-[var(--cl-text-primary)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]'
                          }`}
                        >
                          {pieceSymbol}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Waiting Overlay */}
            {game.status === 'waiting' && (
              <div className="absolute inset-0 bg-[var(--cl-surface-950)]/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
                <Swords className="w-12 h-12 text-[var(--cl-primary)] mb-3 animate-pulse" />
                <h3 className="text-xl font-bold text-[var(--cl-text-primary)]">Waiting for Opponent...</h3>
                <p className="text-[var(--cl-text-secondary)] text-xs mt-1 max-w-xs">
                  Share the match invite link with a club member to start playing!
                </p>
                <button
                  onClick={copyInvite}
                  className="mt-4 bg-[var(--cl-primary)] hover:brightness-110 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <LinkIcon className="w-4 h-4" /> Copy Invite Link
                </button>
              </div>
            )}
          </div>

          {/* Bottom Player Card (White by default unless user is black) */}
          {(() => {
            const bottomPlayer = myColor === 'white' ? game.white_player : game.black_player;
            const bottomColor = myColor === 'white' ? 'white' : 'black';
            const bottomMs = bottomColor === 'white' ? whiteMs : blackMs;
            const isTurn = game.status === 'in_progress' && game.current_turn === bottomColor;

            return (
              <div
                className={`bg-[var(--cl-surface-900)] border p-3 rounded-2xl flex items-center justify-between transition-all ${
                  isTurn ? 'border-[var(--cl-primary)] ring-2 ring-[var(--cl-primary)]/30' : 'border-[var(--cl-border)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={bottomPlayer?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${bottomColor}`}
                      alt="avatar"
                      className="w-10 h-10 rounded-full border border-[var(--cl-border)] object-cover"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--cl-surface-900)] ${
                        bottomColor === 'white' ? 'bg-white' : 'bg-slate-900'
                      }`}
                    ></div>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[var(--cl-text-primary)]">
                      {bottomPlayer?.name || (bottomPlayer ? `User #${bottomPlayer.id}` : 'Waiting...')}
                    </div>
                    <div className="text-xs text-[var(--cl-text-muted)] flex items-center gap-1.5 font-mono">
                      <span>{bottomPlayer?.username ? `@${bottomPlayer.username}` : bottomPlayer ? `@user_${bottomPlayer.id}` : 'Unassigned'}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-[var(--cl-surface-950)] border border-[var(--cl-border)] font-bold text-[var(--cl-text-secondary)]">
                        {bottomColor}
                      </span>
                    </div>
                  </div>
                </div>

                {game.time_control && (
                  <div
                    className={`font-mono text-lg font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 ${
                      isTurn ? 'bg-[var(--cl-primary)] text-slate-950 font-extrabold animate-pulse' : 'bg-[var(--cl-surface-950)] text-[var(--cl-text-muted)] border border-[var(--cl-border)]'
                    }`}
                  >
                    <Clock className="w-4 h-4" /> {formatTime(bottomMs)}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Interactive Replay Controller Toolbar */}
          {(isReplay || replayHistory.length > 0) && (
            <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--cl-text-muted)] font-mono">
                <span className="font-bold flex items-center gap-1.5 text-[var(--cl-text-primary)] text-xs">
                  <History className="w-4 h-4 text-amber-400" />
                  {replayStep === null || replayStep === replayHistory.length
                    ? `Live / Final Position (${replayHistory.length} moves)`
                    : `Replay Step ${replayStep} / ${replayHistory.length}`}
                </span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                  Interactive Replay
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => { setReplayStep(0); setIsPlayingReplay(false); }}
                  title="First Move (Start)"
                  className="p-2.5 rounded-xl bg-[var(--cl-surface-950)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-[var(--cl-text-primary)] transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setReplayStep((prev) => Math.max(0, (prev === null ? replayHistory.length : prev) - 1));
                    setIsPlayingReplay(false);
                  }}
                  title="Previous Move"
                  className="p-2.5 rounded-xl bg-[var(--cl-surface-950)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-[var(--cl-text-primary)] transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (replayStep === null || replayStep >= replayHistory.length) {
                      setReplayStep(0);
                    }
                    setIsPlayingReplay((prev) => !prev);
                  }}
                  title={isPlayingReplay ? 'Pause Auto-Play' : 'Auto-Play Replay'}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95"
                >
                  {isPlayingReplay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  {isPlayingReplay ? 'Pause' : 'Play Replay'}
                </button>

                <button
                  onClick={() => {
                    setReplayStep((prev) => Math.min(replayHistory.length, (prev === null ? 0 : prev) + 1));
                    setIsPlayingReplay(false);
                  }}
                  title="Next Move"
                  className="p-2.5 rounded-xl bg-[var(--cl-surface-950)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-[var(--cl-text-primary)] transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => { setReplayStep(replayHistory.length); setIsPlayingReplay(false); }}
                  title="Final Position"
                  className="p-2.5 rounded-xl bg-[var(--cl-surface-950)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)] text-[var(--cl-text-primary)] transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Move History Notation */}
        <div className="space-y-4 flex flex-col h-full">
          {/* Incoming Draw Request Banner */}
          {drawOfferState && drawOfferState.offeredBy !== user?.id && (
            <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300">Opponent offered a draw!</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDrawAction('accept')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded transition-all cursor-pointer"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDrawAction('decline')}
                  className="bg-[var(--cl-surface-800)] hover:bg-[var(--cl-surface-700)] text-[var(--cl-text-primary)] font-bold px-2.5 py-1 rounded transition-all cursor-pointer border border-[var(--cl-border)]"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Move History Log (Expanded when in replay mode) */}
          <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-[var(--cl-text-muted)] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Swords className="w-3.5 h-3.5 text-[var(--cl-primary)]" /> Move History Notation
              </span>
              <span className="text-[10px] text-[var(--cl-text-muted)] font-mono">
                {chessRef.current.history().length} moves
              </span>
            </h3>
            <div
              ref={moveHistoryRef}
              className={`bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-xl p-3 overflow-y-auto font-mono text-xs text-[var(--cl-text-primary)] custom-scrollbar transition-all ${
                isReplay ? 'h-[440px]' : 'h-36'
              }`}
            >
              {movePairs.length === 0 ? (
                <div className="text-[var(--cl-text-muted)] italic text-center py-8">No moves played yet</div>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-5 text-[10px] text-[var(--cl-text-muted)] uppercase font-semibold pb-1 border-b border-[var(--cl-border)]/50 px-1">
                    <span>Turn</span>
                    <span className="col-span-2">White</span>
                    <span className="col-span-2">Black</span>
                  </div>
                  {movePairs.map((pair) => {
                    const whiteStep = pair.turn * 2 - 1;
                    const blackStep = pair.turn * 2;
                    const isWhiteActive = replayStep === whiteStep;
                    const isBlackActive = replayStep === blackStep;

                    return (
                      <div key={pair.turn} className="grid grid-cols-5 py-1 px-1 text-xs hover:bg-[var(--cl-surface-900)]/60 rounded transition-all">
                        <span className="text-[var(--cl-text-muted)] font-bold">{pair.turn}.</span>
                        <span
                          onClick={() => { setReplayStep(whiteStep); setIsPlayingReplay(false); }}
                          className={`col-span-2 font-bold cursor-pointer px-1 py-0.5 rounded transition-all ${
                            isWhiteActive
                              ? 'bg-[var(--cl-primary)] text-slate-950 font-extrabold'
                              : 'text-[var(--cl-primary-light)] hover:bg-[var(--cl-surface-800)]'
                          }`}
                        >
                          {pair.white}
                        </span>
                        {pair.black ? (
                          <span
                            onClick={() => { setReplayStep(blackStep); setIsPlayingReplay(false); }}
                            className={`col-span-2 cursor-pointer px-1 py-0.5 rounded transition-all ${
                              isBlackActive
                                ? 'bg-[var(--cl-primary)] text-slate-950 font-extrabold'
                                : 'text-[var(--cl-text-primary)] hover:bg-[var(--cl-surface-800)]'
                            }`}
                          >
                            {pair.black}
                          </span>
                        ) : (
                          <span className="col-span-2 text-[var(--cl-text-muted)]">...</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Only render Room Roster & In-Game Chat when NOT in Replay Mode */}
          {!isReplay && (
            <>
              {/* Match Participants & Spectator Roster */}
              <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl p-4 shadow-xl space-y-3">
                <h3 className="text-xs font-bold text-[var(--cl-text-muted)] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[var(--cl-primary)]" /> Room Roster
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-[var(--cl-text-muted)] bg-[var(--cl-surface-950)] border border-[var(--cl-border)]">
                    {game.allow_spectators ? 'Spectators Enabled' : 'Players Only'}
                  </span>
                </h3>

                {/* Active Players */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-[var(--cl-text-muted)] uppercase tracking-wider flex items-center gap-1">
                    <Swords className="w-3 h-3 text-[var(--cl-primary)]" /> Playing Participants
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--cl-surface-950)] border border-[var(--cl-border)]/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-white border border-slate-900 shrink-0" title="White Player" />
                      <img
                        src={game.white_player?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(game.white_player?.name || 'white')}`}
                        alt="White Player"
                        className="w-6 h-6 rounded-full object-cover border border-[var(--cl-border)] shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-[var(--cl-text-primary)] truncate text-xs block">
                          {game.white_player?.name || 'White Player'}
                        </span>
                        {game.white_player?.username && (
                          <span className="text-[10px] text-[var(--cl-text-muted)] font-mono block">
                            @{game.white_player.username}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                      White
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-[var(--cl-surface-950)] border border-[var(--cl-border)]/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-slate-900 border border-white/50 shrink-0" title="Black Player" />
                      <img
                        src={game.black_player?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(game.black_player?.name || 'black')}`}
                        alt="Black Player"
                        className="w-6 h-6 rounded-full object-cover border border-[var(--cl-border)] shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-[var(--cl-text-primary)] truncate text-xs block">
                          {game.black_player?.name || 'Waiting for opponent...'}
                        </span>
                        {game.black_player?.username && (
                          <span className="text-[10px] text-[var(--cl-text-muted)] font-mono block">
                            @{game.black_player.username}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider bg-slate-500/20 px-2 py-0.5 rounded border border-slate-500/30 shrink-0">
                      Black
                    </span>
                  </div>
                </div>

                {/* Currently Spectating Section (Single Line Overlapping Avatars + Modal Button) */}
                {(() => {
                  const activeSpectators = (roomUsers || []).filter(
                    (u) => u.id !== game.white_player_id && u.id !== game.black_player_id && u.id !== game.host_player_id
                  );

                  return (
                    <div className="pt-2.5 border-t border-[var(--cl-border)]/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-[var(--cl-text-muted)] uppercase tracking-wider flex items-center gap-1">
                          <Eye className="w-3 h-3 text-emerald-400" /> Spectators
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {activeSpectators.length} watching
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 bg-[var(--cl-surface-950)]/70 p-2 rounded-xl border border-[var(--cl-border)]/40">
                        {activeSpectators.length === 0 ? (
                          <span className="text-xs text-[var(--cl-text-muted)] italic">No active spectators</span>
                        ) : (
                          /* Overlapping Avatar Stack (Single Line - No names) */
                          <div className="flex items-center -space-x-2 overflow-hidden py-0.5">
                            {activeSpectators.slice(0, 5).map((spec, i) => (
                              <img
                                key={spec.id || i}
                                src={spec.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(spec.name)}`}
                                alt={spec.name}
                                title={spec.name}
                                className="w-7 h-7 rounded-full object-cover border-2 border-[var(--cl-surface-950)] shadow-md transition-transform hover:scale-115 hover:z-20 cursor-pointer shrink-0"
                              />
                            ))}
                            {activeSpectators.length > 5 && (
                              <div className="w-7 h-7 rounded-full bg-[var(--cl-surface-800)] text-[var(--cl-text-primary)] font-bold text-[10px] flex items-center justify-center border-2 border-[var(--cl-surface-950)] shrink-0">
                                +{activeSpectators.length - 5}
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => setShowSpectatorsModal(true)}
                          className="bg-[var(--cl-primary)]/15 hover:bg-[var(--cl-primary)]/30 text-[var(--cl-primary-light)] border border-[var(--cl-primary)]/30 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95"
                        >
                          <Eye className="w-3 h-3" /> View All ({activeSpectators.length})
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* In-Game Message Hub */}
              <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl p-4 shadow-xl flex-1 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-[var(--cl-text-muted)] uppercase tracking-wider flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-[var(--cl-primary)]" />
                    {isPlayer ? 'Player Match Chat' : '👁️ Spectator Chat'}
                  </h3>
                  {!isPlayer && (
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Spectators Only
                    </span>
                  )}
                </div>

                {/* Spectator notice for players */}
                {isPlayer && (
                  <div className="mb-2 text-[10px] text-[var(--cl-text-muted)] bg-[var(--cl-surface-950)] border border-[var(--cl-border)]/60 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Spectator chat is isolated from players during gameplay.</span>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 text-xs custom-scrollbar">
                  {(isPlayer ? gameMessages : spectatorMessages).length === 0 ? (
                    <div className="text-[var(--cl-text-muted)] text-center py-10 text-xs italic">
                      {isPlayer ? 'No match player messages yet.' : 'No spectator chat messages yet.'}
                    </div>
                  ) : (
                    (isPlayer ? gameMessages : spectatorMessages).map((msg, i) => (
                      <div key={i} className="bg-[var(--cl-surface-950)] border border-[var(--cl-border)] p-2 rounded-lg">
                        <div className="flex items-center justify-between text-[10px] text-[var(--cl-text-muted)] mb-1">
                          <span className="font-bold text-[var(--cl-primary)]">{msg.sender?.name || 'User'}</span>
                          <span>
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-[var(--cl-text-primary)] break-words">{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={isPlayer ? 'Chat with opponent...' : 'Chat with other spectators...'}
                    className="flex-1 bg-[var(--cl-surface-950)] border border-[var(--cl-border)] text-xs text-[var(--cl-text-primary)] rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--cl-primary)]"
                  />
                  <button
                    type="submit"
                    className="bg-[var(--cl-primary)] text-slate-950 font-bold p-2 rounded-lg transition-all hover:brightness-110 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Game Over Modal / Result Overlay */}
      {game.status === 'completed' && showGameOverModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setShowGameOverModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] hover:bg-[var(--cl-surface-800)] transition-colors cursor-pointer"
              title="Close Result Screen"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-[var(--cl-primary-glow)] border border-[var(--cl-primary)]/40 flex items-center justify-center mx-auto text-amber-400">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-[var(--cl-text-primary)]">
                {game.is_draw ? 'Game Drawn!' : game.winner?.name ? `${game.winner.name} Wins!` : 'Match Complete!'}
              </h2>
              <p className="text-[var(--cl-text-muted)] text-xs mt-1 capitalize">Reason: {game.win_reason || 'Checkmate'}</p>
            </div>

            {/* Point Distribution Summary */}
            <div className="bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-xl p-4 text-left space-y-2 text-xs">
              <div className="text-[var(--cl-text-muted)] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" /> Reward & Point Breakdown
              </div>
              <div className="flex items-center justify-between text-[var(--cl-text-primary)]">
                <span>Participation Reputation Points:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {game.is_draw ? '+2 Rep (Both)' : user && game.winner_id === user.id ? '+3 Rep (Winner)' : '+1 Rep (Loser)'}
                </span>
              </div>
              {game.type === 'ranked' && (
                <div className="flex items-center justify-between text-[var(--cl-text-primary)]">
                  <span>ELO Rating Adjustment:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    White ({game.white_elo_change && game.white_elo_change > 0 ? `+${game.white_elo_change}` : game.white_elo_change}) / Black ({game.black_elo_change && game.black_elo_change > 0 ? `+${game.black_elo_change}` : game.black_elo_change})
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setShowGameOverModal(false);
                  setReplayStep(0);
                  setIsPlayingReplay(false);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-bold text-sm py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <History className="w-4 h-4" /> Start Interactive Match Replay
              </button>

              <button
                onClick={bootUserBack}
                className="w-full bg-[var(--cl-surface-800)] hover:bg-[var(--cl-surface-700)] text-[var(--cl-text-primary)] font-bold text-sm py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-[var(--cl-border)]"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                {(game as any)?.tournament_id || (game as any)?.tournament?.id
                  ? 'Return to Tournament Details'
                  : 'Return to Match Lobby'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Spectators List Modal */}
      {showSpectatorsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--cl-border)]">
              <h3 className="text-sm font-bold text-[var(--cl-text-primary)] flex items-center gap-2 font-[family-name:var(--font-heading)]">
                <Eye className="w-4 h-4 text-emerald-400" /> Active Spectators List
              </h3>
              <button
                onClick={() => setShowSpectatorsModal(false)}
                className="p-1 rounded-lg text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] hover:bg-[var(--cl-surface-800)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const activeSpectators = (roomUsers || []).filter(
                (u) => u.id !== game.white_player_id && u.id !== game.black_player_id && u.id !== game.host_player_id
              );

              return activeSpectators.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--cl-text-muted)] italic">
                  No active spectators watching this match right now.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {activeSpectators.map((spec) => (
                    <div
                      key={spec.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[var(--cl-surface-950)] border border-[var(--cl-border)]/60 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={spec.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(spec.name)}`}
                          alt={spec.name}
                          className="w-8 h-8 rounded-full object-cover border border-[var(--cl-border)] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[var(--cl-text-primary)] truncate text-xs">
                            {spec.name}
                          </div>
                          <div className="text-[10px] text-[var(--cl-text-muted)] capitalize truncate">
                            {spec.role || 'Member'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        Spectator
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}

            <button
              onClick={() => setShowSpectatorsModal(false)}
              className="w-full bg-[var(--cl-surface-800)] hover:bg-[var(--cl-surface-700)] text-[var(--cl-text-primary)] font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer border border-[var(--cl-border)]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
