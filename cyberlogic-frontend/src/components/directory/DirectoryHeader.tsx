interface DirectoryHeaderProps {
  totalCount: number;
  onlineCount: number;
}

export function DirectoryHeader({ totalCount, onlineCount }: DirectoryHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary animate-fadeIn">
        Member Directory
      </h1>
      <p className="text-sm text-text-muted mt-1 animate-fadeIn">
        {totalCount} members · {onlineCount} online now
      </p>
    </div>
  );
}
