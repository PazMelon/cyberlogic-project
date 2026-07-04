import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Eye,
  Share2,
  Flag,
  CheckCircle,
  Award,
  Send,
} from "lucide-react";
import { forumThreads, forumReplies, forumCategories } from "../data/mockData";

export default function ForumThread() {
  const { threadId } = useParams();
  const thread = forumThreads.find((t) => t.id === Number(threadId));
  const replies = forumReplies.filter((r) => r.threadId === Number(threadId));

  if (!thread) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Thread Not Found</h2>
        <p className="text-text-muted mb-4">The thread you're looking for doesn't exist.</p>
        <Link to="/app/forums" className="text-primary hover:text-primary-light font-medium">
          Back to Forums
        </Link>
      </div>
    );
  }

  const category = forumCategories.find((c) => c.id === thread.categoryId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to="/app/forums"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Forums
      </Link>

      {/* Thread Header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          {thread.solved && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Solved
            </span>
          )}
          {category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {category.name}
            </span>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary mb-4">
          {thread.title}
        </h1>

        <div className="flex items-center gap-3 mb-5">
          <img
            src={thread.authorAvatar}
            alt={thread.author}
            className="w-10 h-10 rounded-full bg-surface-700"
          />
          <div>
            <p className="text-sm font-semibold text-text-primary">{thread.author}</p>
            <p className="text-xs text-text-muted">Posted on {thread.createdAt}</p>
          </div>
        </div>

        <div className="text-sm text-text-secondary leading-relaxed mb-5 whitespace-pre-wrap">
          {thread.content}
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <button type="button" className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors">
            <Heart className="w-4 h-4" /> {thread.likes} Likes
          </button>
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            <MessageSquare className="w-4 h-4" /> {thread.replyCount} Replies
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            <Eye className="w-4 h-4" /> {thread.views} Views
          </span>
          <div className="flex-1" />
          <button type="button" className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button type="button" className="flex items-center gap-1.5 text-xs text-text-muted hover:text-warning transition-colors">
            <Flag className="w-4 h-4" /> Report
          </button>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-heading)]">
          {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
        </h2>

        {replies.map((reply) => (
          <div
            key={reply.id}
            className={`glass rounded-xl p-5 ${
              reply.isBestAnswer ? "border-success/30 bg-success/5" : ""
            }`}
          >
            {reply.isBestAnswer && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-success mb-3">
                <Award className="w-4 h-4" /> Best Answer
              </div>
            )}

            <div className="flex items-start gap-3">
              <img
                src={reply.authorAvatar}
                alt={reply.author}
                className="w-9 h-9 rounded-full bg-surface-700 flex-shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-text-primary">{reply.author}</span>
                  <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                    {reply.authorRole}
                  </span>
                  <span className="text-xs text-text-muted ml-auto">{reply.createdAt}</span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{reply.content}</p>
                <div className="flex items-center gap-4 mt-3">
                  <button type="button" className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors">
                    <Heart className="w-3.5 h-3.5" /> {reply.likes}
                  </button>
                  <button type="button" className="text-xs text-text-muted hover:text-primary transition-colors">
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Input */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Write a Reply</h3>
        <textarea
          rows={4}
          placeholder="Share your thoughts..."
          className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all resize-none mb-3"
        />
        <div className="flex justify-end">
          <button
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-0.5"
          >
            <Send className="w-4 h-4" /> Post Reply
          </button>
        </div>
      </div>
    </div>
  );
}
