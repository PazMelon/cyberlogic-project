import { X } from "lucide-react";

export interface MembersListProps {
  onlineUsers: {
    id: number;
    name: string;
    avatar: string;
    role: string;
  }[];
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function MembersList({
  onlineUsers,
  onClose,
  showCloseButton = false,
}: MembersListProps) {
  return (
    <>
      <div className="h-[57px] border-b border-border flex items-center justify-between px-4 flex-shrink-0">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Online Members
        </h3>
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {onlineUsers.map((m) => (
          <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <div className="relative">
              <img
                src={m.avatar}
                alt={m.name}
                className="w-8 h-8 rounded-full bg-surface-700 object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-950 bg-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-primary truncate">{m.name}</p>
              <p className="text-[9px] text-text-muted truncate capitalize">{m.role}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
