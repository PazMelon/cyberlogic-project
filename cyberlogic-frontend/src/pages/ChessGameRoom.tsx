import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Chess, type Square, type Color } from 'chess.js';
import { useAuth } from '../context/AuthContext';
import { useChessRealtime } from '../hooks/useChessRealtime';
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
  Award,
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
  const { user } = useAuth();

  const [game, setGame] = useState<ChessGame | null>(null);
  const [isPlayer, setIsPlayer] = useState(false);
  const [spectatorBlocked, setSpectatorBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Chess.js instance
  const chessRef = useRef<Chess>(new Chess());
  const [, setBoardVersion] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);

  // Timers
  const [whiteMs, setWhiteMs] = useState<number>(0);
  const [blackMs, setBlackMs] = useState<number>(0);

  // Chat message input
  const [chatInput, setChatInput] = useState('');

  // Realtime hook
  const {
    gameMessages,
    latestGameUpdate,
    latestMove,
    drawOfferState,
    sendGameChat,
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

        if (data.game.fen) {
          chessRef.current.load(data.game.fen);
          setBoardVersion((v) => v + 1);
        }

        if (data.game.white_time_left_ms) setWhiteMs(data.game.white_time_left_ms);
        if (data.game.black_time_left_ms) setBlackMs(data.game.black_time_left_ms);
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
    if (latestMove && latestMove.fen) {
      chessRef.current.load(latestMove.fen);
      setBoardVersion((v) => v + 1);

      if (latestMove.white_time_left_ms !== undefined) setWhiteMs(latestMove.white_time_left_ms);
      if (latestMove.black_time_left_ms !== undefined) setBlackMs(latestMove.black_time_left_ms);

      setGame((prev) => (prev ? { ...prev, current_turn: latestMove.current_turn, fen: latestMove.fen } : null));
    }
  }, [latestMove]);

  // Handle latest game status updates
  useEffect(() => {
    if (latestGameUpdate) {
      setGame(latestGameUpdate);
      if (latestGameUpdate.fen) {
        chessRef.current.load(latestGameUpdate.fen);
        setBoardVersion((v) => v + 1);
      }
    }
  }, [latestGameUpdate]);

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
    if (game.current_turn === 'white' && game.white_player_id === user.id) return true;
    if (game.current_turn === 'black' && game.black_player_id === user.id) return true;
    return false;
  }, [game, user]);

  const myColor = useMemo(() => {
    if (!game || !user) return 'white';
    if (game.black_player_id === user.id && game.white_player_id !== user.id) return 'black';
    return 'white';
  }, [game, user]);

  // Square Click / Move Handler
  const handleSquareClick = (square: Square) => {
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
            setGame(updated);
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
      alert('Could not join match.');
    }
  };

  const handleResign = async () => {
    if (!game || !window.confirm('Are you sure you want to resign this match?')) return;
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
    sendGameChat(chatInput);
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

  const boardArray = chessRef.current.board();

  return (
    <div className="space-y-6 text-[var(--cl-text-primary)] font-sans">
      {/* Top Header Card */}
      <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/chess')}
            className="p-2.5 bg-[var(--cl-surface-950)] hover:bg-[var(--cl-surface-800)] border border-[var(--cl-border)] rounded-xl text-[var(--cl-text-secondary)] hover:text-[var(--cl-text-primary)] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
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
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[var(--cl-text-primary)] mt-1">1v1 Chess Arena</h1>
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
                    <div className="font-bold text-sm text-[var(--cl-text-primary)]">{topPlayer?.name || (topPlayer ? `User #${topPlayer.id}` : 'Waiting for Player...')}</div>
                    <div className="text-xs text-[var(--cl-text-muted)] uppercase font-mono">{topColor}</div>
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
          <div className="relative aspect-square max-w-[540px] mx-auto bg-[var(--cl-surface-900)] border-4 border-[var(--cl-border)] rounded-2xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
              {displayRanks.map((r, rIdx) =>
                displayFiles.map((f, fIdx) => {
                  const square = `${f}${r}` as Square;
                  const isDark = (files.indexOf(f) + ranks.indexOf(r)) % 2 === 1;

                  // Find piece on this square
                  const rankNum = 8 - parseInt(r, 10);
                  const fileNum = files.indexOf(f);
                  const pieceObj = boardArray[rankNum]?.[fileNum];

                  const pieceKey = pieceObj ? `${pieceObj.color}${pieceObj.type.toUpperCase()}` : null;
                  const pieceSymbol = pieceKey ? PIECE_UNICODE[pieceKey] : null;

                  const isSelected = selectedSquare === square;
                  const isPossible = possibleMoves.includes(square);

                  return (
                    <div
                      key={square}
                      onClick={() => handleSquareClick(square)}
                      className={`relative flex items-center justify-center text-4xl select-none cursor-pointer transition-colors ${
                        isDark
                          ? 'bg-[var(--cl-surface-800)]/80 text-[var(--cl-text-primary)]'
                          : 'bg-[var(--cl-surface-900)] text-[var(--cl-text-primary)]'
                      } ${isSelected ? 'bg-[var(--cl-primary)]/40 ring-2 ring-[var(--cl-primary)] inset-0 z-10' : ''}`}
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
                    <div className="font-bold text-sm text-[var(--cl-text-primary)]">{bottomPlayer?.name || (bottomPlayer ? `User #${bottomPlayer.id}` : 'Waiting...')}</div>
                    <div className="text-xs text-[var(--cl-text-muted)] uppercase font-mono">{bottomColor}</div>
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
        </div>

        {/* Right Column: Move History & Match Chat */}
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

          {/* Move History Log */}
          <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold text-[var(--cl-text-muted)] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Swords className="w-3.5 h-3.5 text-[var(--cl-primary)]" /> Move History Notation
              </span>
            </h3>
            <div className="bg-[var(--cl-surface-950)] border border-[var(--cl-border)] rounded-xl p-3 h-28 overflow-y-auto font-mono text-xs text-[var(--cl-text-primary)] custom-scrollbar">
              {game.pgn ? (
                <div className="whitespace-pre-wrap leading-relaxed">
                  {game.pgn
                    .replace(/\[.*?\]/g, '')
                    .replace(/\*|1-0|0-1|1\/2-1\/2$/g, '')
                    .trim()}
                </div>
              ) : (
                <div className="text-[var(--cl-text-muted)] italic">No moves played yet</div>
              )}
            </div>
          </div>

          {/* In-Game Message Hub */}
          <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl p-4 shadow-xl flex-1 flex flex-col min-h-[300px]">
            <h3 className="text-xs font-bold text-[var(--cl-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-[var(--cl-primary)]" /> In-Game Chat
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 text-xs custom-scrollbar">
              {gameMessages.length === 0 ? (
                <div className="text-[var(--cl-text-muted)] text-center py-10 text-xs">
                  No match chat messages yet.
                </div>
              ) : (
                gameMessages.map((msg, i) => (
                  <div key={i} className="bg-[var(--cl-surface-950)] border border-[var(--cl-border)] p-2 rounded-lg">
                    <div className="flex items-center justify-between text-[10px] text-[var(--cl-text-muted)] mb-1">
                      <span className="font-bold text-[var(--cl-primary)]">{msg.sender?.name || 'Player'}</span>
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
                placeholder="Chat in match..."
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
        </div>
      </div>

      {/* Game Over Modal / Result Overlay */}
      {game.status === 'completed' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
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

            <button
              onClick={() => navigate('/app/chess')}
              className="w-full bg-[var(--cl-primary)] hover:brightness-110 text-slate-950 font-bold text-sm py-3 rounded-xl transition-all cursor-pointer"
            >
              Return to Chess Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
