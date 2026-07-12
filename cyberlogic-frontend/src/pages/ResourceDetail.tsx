import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router";
import {
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Download,
  ExternalLink,
  BookOpen,
  Shield,
  FileText,
  Terminal,
  Activity,
  Code,
  Eye,
} from "lucide-react";
import { fetchResourceById, voteResource, type ResourceMapped } from "../utils/api";
import { useSEO } from "../utils/useSEO";
import DetailLayout from "../components/common/DetailLayout";

const iconMap: Record<string, React.ReactNode> = {
  code: <Code className="w-5 h-5" />,
  shield: <Shield className="w-5 h-5" />,
  "file-text": <FileText className="w-5 h-5" />,
  "external-link": <ExternalLink className="w-5 h-5" />,
  terminal: <Terminal className="w-5 h-5" />,
  activity: <Activity className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  Tutorials: "bg-primary/10 text-primary border-primary/20",
  Documents: "bg-info/10 text-info border-info/20",
  Tools: "bg-accent/10 text-accent border-accent/20",
  Links: "bg-success/10 text-success border-success/20",
};

export default function ResourceDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/app");

  const [item, setItem] = useState<ResourceMapped | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSEO({
    title: item ? item.title : "Loading Resource...",
    description: item ? item.description : undefined,
    keywords: item ? [item.category, "Resource", "Cyberlogic Resource"] : undefined,
    type: "object",
  });

  const loadDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchResourceById(Number(id));
      setItem(data);
    } catch (err: any) {
      console.error("Failed to load resource details:", err);
      setError(err.message || "Failed to load resource details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleVote = async (value: number) => {
    if (!item) return;
    try {
      const result = await voteResource(item.id, value);
      setItem((prev) =>
        prev ? { ...prev, voteScore: result.voteScore, userVote: result.userVote } : null
      );
    } catch (err) {
      console.error("Failed to vote on resource:", err);
    }
  };

  const submitterName = item?.user?.name || "System Admin";
  const submitterAvatar = item?.user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=admin";

  const badges = item && (
    <>
      <span
        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          categoryColors[item.category] || "bg-surface-700 text-text-secondary"
        }`}
      >
        {item.category}
      </span>
      {isPortal && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            item.status === "approved"
              ? "bg-success/10 text-success border-success/20"
              : item.status === "rejected"
              ? "bg-error/10 text-error border-error/20"
              : "bg-warning/10 text-warning border-warning/20 animate-pulse"
          }`}
        >
          {item.status.toUpperCase()}
        </span>
      )}
    </>
  );

  const portalPrimaryAction = item && (
    <div className="glass rounded-2xl p-6 border border-border space-y-4 bg-gradient-to-br from-primary/5 to-accent/5">
      <h3 className="text-sm font-semibold text-text-primary">Resource Access</h3>
      <p className="text-xs text-text-muted">
        {item.filePathUrl
          ? "This resource contains a downloadable file attached by the creator."
          : "This resource redirects to an external link verified by the club."}
      </p>
      
      <div className="flex flex-wrap gap-4 pt-2">
        {item.filePathUrl && (
          <a
            href={`/api/resources/${item.id}/download?type=file`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-light hover:shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download File Attachment
          </a>
        )}

        {item.link && (
          <a
            href={`/api/resources/${item.id}/download?type=link`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-800 border border-border text-text-primary text-sm font-bold hover:bg-surface-750 transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-primary" /> Open Resource Link
          </a>
        )}
      </div>
    </div>
  );

  const sidebar = item && (
    <>
      {/* Submitter & Vote Card */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary/30 via-accent/30 to-success/30" />
        <div className="p-5 space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Resource Submitter
          </h3>

          {item.user ? (
            <Link
              to={`/app/profile/${item.user.id}`}
              className="flex items-center gap-3 py-2 border-b border-border/50 hover:opacity-85 transition-opacity"
            >
              <img
                src={submitterAvatar}
                alt={submitterName}
                className="w-10 h-10 rounded-full bg-surface-700 border border-border/85 object-cover"
              />
              <div>
                <p className="text-xs text-text-muted">Uploaded By</p>
                <p className="text-sm font-bold text-text-primary hover:text-primary transition-colors">{submitterName}</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 py-2 border-b border-border/50">
              <img
                src={submitterAvatar}
                alt={submitterName}
                className="w-10 h-10 rounded-full bg-surface-700 border border-border/85 object-cover"
              />
              <div>
                <p className="text-xs text-text-muted">Uploaded By</p>
                <p className="text-sm font-bold text-text-primary">{submitterName}</p>
              </div>
            </div>
          )}

          {/* Voting Section */}
          <div className="py-2 border-b border-border/50">
            <p className="text-xs text-text-muted mb-2">Community Rating</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleVote(1)}
                className={`p-2 rounded-xl border border-border hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold ${
                  item.userVote === 1 ? "text-primary bg-primary/10 border-primary/20" : "text-text-muted hover:text-text-primary"
                }`}
              >
                <ThumbsUp className="w-4 h-4" /> Helpful
              </button>
              <span className="text-sm font-extrabold text-text-primary min-w-[20px] text-center">
                {item.voteScore}
              </span>
              <button
                type="button"
                onClick={() => handleVote(-1)}
                className={`p-2 rounded-xl border border-border hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold ${
                  item.userVote === -1 ? "text-error bg-error/10 border-error/20" : "text-text-muted hover:text-text-primary"
                }`}
              >
                <ThumbsDown className="w-4 h-4" /> Unhelpful
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Shared: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recently"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Eye className="w-4 h-4 text-primary-light" />
              <span>{item.accessCount} views</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Download className="w-4 h-4 text-accent" />
              <span>{item.downloadCount} downloads</span>
            </div>
          </div>

        </div>
      </div>

      {/* Info Card */}
      <div className="glass rounded-xl p-4 border border-border space-y-3">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
          {iconMap[item.icon] || <BookOpen className="w-4 h-4" />} Category Details
        </h3>
        <p className="text-[11px] text-text-muted leading-relaxed">
          This item belongs to <strong>{item.category}</strong>. All submissions are moderated by the Cyberlogic officers. Report any broken links or malware files.
        </p>
      </div>
    </>
  );

  return (
    <DetailLayout
      isPortal={isPortal}
      backLink={{
        to: isPortal ? "/app/resources" : "/resources",
        label: "Back to Resources",
      }}
      badges={badges}
      title={item?.title || ""}
      subtitle={item?.subtitle}
      image={item?.image}
      introText={item?.description}
      sections={item?.sections}
      sidebar={sidebar}
      portalPrimaryAction={portalPrimaryAction}
      showSidebarOnPublic={true}
      publicContainerClass="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6"
      loading={loading}
      loadingText="Retrieving resource details..."
      error={error}
      errorTitle="Resource Not Found"
    />
  );
}
