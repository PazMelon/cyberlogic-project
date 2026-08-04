import { useState } from 'react';
import { useNavigate } from 'react-router';
import { type ChessGame } from '../../utils/chessApi';
import { DataTable, type ColumnDef, type FilterGroup } from '../ui/DataTable';
import { History, Swords, Clock, Eye, RotateCw, Trophy, Info, X } from 'lucide-react';

interface ChessMatchHistoryCardProps {
  history: ChessGame[];
  loading: boolean;
  onRefresh?: () => void;
}

export function ChessMatchHistoryCard({ history, loading, onRefresh }: ChessMatchHistoryCardProps) {
  const navigate = useNavigate();
  const [selectedLegacyGame, setSelectedLegacyGame] = useState<ChessGame | null>(null);

  // Dynamic summary metrics
  const totalMatches = history.length;
  const rankedCount = history.filter((g) => g.type === 'ranked').length;
  const casualCount = history.filter((g) => g.type === 'casual').length;
  const drawCount = history.filter((g) => g.is_draw).length;

  const columns: ColumnDef<ChessGame>[] = [
    {
      header: 'Match Code',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[var(--cl-primary-light)] bg-[var(--cl-surface-950)] px-2 py-0.5 rounded-lg border border-[var(--cl-border)] shadow-xs">
            #{row.game_code}
          </span>
          <span
            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
              row.type === 'ranked'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            }`}
          >
            {row.type}
          </span>
        </div>
      ),
      sortable: true,
      sortKey: 'game_code',
    },
    {
      header: 'White Player',
      accessor: (row) => {
        const player = row.white_player;
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-white border border-slate-900 shrink-0 shadow-xs" title="White Player" />
            <img
              src={player?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(player?.name || 'white')}`}
              alt="White Player"
              className="w-7 h-7 rounded-full object-cover border border-[var(--cl-border)] shrink-0"
            />
            <div className="min-w-0">
              <div className="font-bold text-xs text-[var(--cl-text-primary)] truncate">
                {player?.name || (row.white_player_id ? `User #${row.white_player_id}` : 'Unassigned')}
              </div>
              {player?.username && (
                <div className="text-[10px] text-[var(--cl-text-muted)] font-mono truncate">
                  @{player.username}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Black Player',
      accessor: (row) => {
        const player = row.black_player;
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-white/60 shrink-0 shadow-xs" title="Black Player" />
            <img
              src={player?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(player?.name || 'black')}`}
              alt="Black Player"
              className="w-7 h-7 rounded-full object-cover border border-[var(--cl-border)] shrink-0"
            />
            <div className="min-w-0">
              <div className="font-bold text-xs text-[var(--cl-text-primary)] truncate">
                {player?.name || (row.black_player_id ? `User #${row.black_player_id}` : 'Unassigned')}
              </div>
              {player?.username && (
                <div className="text-[10px] text-[var(--cl-text-muted)] font-mono truncate">
                  @{player.username}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Result / Winner',
      accessor: (row) => {
        if (row.is_draw) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 capitalize">
              🤝 Draw ({row.win_reason || 'agreement'})
            </span>
          );
        }

        if (row.winner) {
          return (
            <div className="flex items-center gap-1.5 min-w-0">
              <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-xs text-emerald-400 truncate block">
                  {row.winner.name}
                </span>
                <span className="text-[10px] text-[var(--cl-text-muted)] capitalize block">
                  {row.win_reason || 'checkmate'}
                </span>
              </div>
            </div>
          );
        }

        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--cl-text-muted)] bg-[var(--cl-surface-950)] px-2.5 py-1 rounded-lg border border-[var(--cl-border)] capitalize">
            {row.status === 'aborted' || row.status === 'cancelled' ? '⚠️ Aborted' : row.win_reason || 'Ended'}
          </span>
        );
      },
    },
    {
      header: 'Time Control',
      accessor: (row) => (
        <span className="text-xs font-mono text-[var(--cl-text-secondary)] flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-[var(--cl-text-muted)]" />
          {row.time_control ? `${row.time_control} mins` : 'Untimed'}
        </span>
      ),
    },
    {
      header: 'Date Played',
      accessor: (row) => {
        const rawDate = row.ended_at || row.created_at;
        const formatted = rawDate ? new Date(rawDate).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : 'N/A';

        return <span className="text-xs text-[var(--cl-text-muted)] font-mono">{formatted}</span>;
      },
      sortable: true,
      sortKey: 'created_at',
    },
    {
      header: 'Action',
      accessor: (row) => (
        <button
          onClick={() => {
            if (!row.pgn || row.pgn.trim() === '' || row.pgn.startsWith('rnbqkbnr')) {
              setSelectedLegacyGame(row);
            } else {
              navigate(`/app/chess/game/${row.game_code}?mode=replay`);
            }
          }}
          className="bg-[var(--cl-primary)]/15 hover:bg-[var(--cl-primary)]/30 text-[var(--cl-primary-light)] border border-[var(--cl-primary)]/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 whitespace-nowrap shadow-xs"
        >
          <Eye className="w-3.5 h-3.5" /> View Match
        </button>
      ),
    },
  ];

  const filterGroups: FilterGroup[] = [
    {
      label: 'Match Mode',
      field: 'type',
      options: [
        { label: 'All Modes', value: 'All' },
        { label: 'Ranked', value: 'ranked' },
        { label: 'Casual', value: 'casual' },
      ],
    },
    {
      label: 'Game Outcome',
      field: 'win_reason',
      options: [
        { label: 'All Outcomes', value: 'All' },
        { label: 'Checkmate', value: 'checkmate' },
        { label: 'Resignation', value: 'resignation' },
        { label: 'Timeout', value: 'timeout' },
        { label: 'Draw', value: 'draw' },
      ],
    },
  ];

  const searchField = (game: ChessGame): string => {
    const whiteName = game.white_player?.name || '';
    const whiteUser = game.white_player?.username || '';
    const blackName = game.black_player?.name || '';
    const blackUser = game.black_player?.username || '';
    const winnerName = game.winner?.name || '';
    const winReason = game.win_reason || '';
    return `${game.game_code} ${game.type} ${whiteName} ${whiteUser} ${blackName} ${blackUser} ${winnerName} ${winReason}`.toLowerCase();
  };

  return (
    <>
      <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        {/* Header & Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--cl-border)]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--cl-primary)]/15 border border-[var(--cl-primary)]/30 flex items-center justify-center text-[var(--cl-primary)] shadow-sm shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--cl-text-primary)] flex items-center gap-2">
                Global Chess Match History
              </h2>
              <p className="text-xs text-[var(--cl-text-muted)] mt-0.5">
                Archive of completed, resigned, and drawn 1v1 chess matches with interactive move replays.
              </p>
            </div>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="self-start sm:self-auto bg-[var(--cl-surface-950)] hover:bg-[var(--cl-surface-800)] text-[var(--cl-text-primary)] border border-[var(--cl-border)] text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-xs"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh History
            </button>
          )}
        </div>

        {/* Quick Summary Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--cl-surface-950)]/80 border border-[var(--cl-border)]/60 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              ⚔️
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--cl-text-muted)] tracking-wider">Total Games</div>
              <div className="text-base font-black text-[var(--cl-text-primary)]">{totalMatches}</div>
            </div>
          </div>

          <div className="bg-[var(--cl-surface-950)]/80 border border-[var(--cl-border)]/60 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
              🏆
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--cl-text-muted)] tracking-wider">Ranked</div>
              <div className="text-base font-black text-amber-400">{rankedCount}</div>
            </div>
          </div>

          <div className="bg-[var(--cl-surface-950)]/80 border border-[var(--cl-border)]/60 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
              🎮
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--cl-text-muted)] tracking-wider">Casual</div>
              <div className="text-base font-black text-emerald-400">{casualCount}</div>
            </div>
          </div>

          <div className="bg-[var(--cl-surface-950)]/80 border border-[var(--cl-border)]/60 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
              🤝
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--cl-text-muted)] tracking-wider">Draws</div>
              <div className="text-base font-black text-purple-400">{drawCount}</div>
            </div>
          </div>
        </div>

        {/* Integrated Flat DataTable Component */}
        {loading ? (
          <div className="py-16 text-center text-xs text-[var(--cl-text-muted)] flex items-center justify-center gap-2 bg-[var(--cl-surface-950)]/40 rounded-2xl border border-[var(--cl-border)]/60">
            <Swords className="w-5 h-5 text-[var(--cl-primary)] animate-spin" /> Loading match history records...
          </div>
        ) : (
          <DataTable<ChessGame>
            data={history}
            columns={columns}
            filterGroups={filterGroups}
            searchPlaceholder="Search player name, username, match code..."
            searchField={searchField}
            emptyStateText="No recorded chess match history found."
            enablePagination={true}
            defaultItemsPerPage={10}
            itemsPerPageOptions={[5, 10, 20, 50]}
            variant="flat"
          />
        )}
      </div>

      {/* Legacy Game Replay Not Available Modal */}
      {selectedLegacyGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[var(--cl-surface-900)] border border-[var(--cl-border)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center relative overflow-hidden">
            <button
              onClick={() => setSelectedLegacyGame(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--cl-text-muted)] hover:text-[var(--cl-text-primary)] hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <History className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-[var(--cl-text-primary)]">
                Replay Unavailable
              </h3>
              <p className="text-xs text-[var(--cl-text-muted)] leading-relaxed">
                Match <span className="font-mono text-amber-400 font-bold">#{selectedLegacyGame.game_code}</span> was played prior to the interactive move recording feature release and does not have saved PGN move notation data.
              </p>
            </div>

            <div className="bg-[var(--cl-surface-950)] border border-[var(--cl-border)] p-3 rounded-xl text-[11px] text-[var(--cl-text-secondary)] text-left space-y-1">
              <div className="font-bold text-[var(--cl-text-primary)] flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-400" /> Note for Players:
              </div>
              <p className="text-[var(--cl-text-muted)]">
                Interactive step-by-step move replay is supported for all new matches played after this update!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedLegacyGame(null)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
