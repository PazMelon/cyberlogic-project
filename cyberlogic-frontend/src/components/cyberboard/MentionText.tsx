import React from "react";
import { Link } from "react-router";
import { Shield, Users, GraduationCap } from "lucide-react";

interface MentionTextProps {
  content: string;
  className?: string;
}

export default function MentionText({ content, className = "" }: MentionTextProps) {
  if (!content) return null;

  // Split content by whitespace or mentions
  const tokens = content.split(/(\s+)/);

  return (
    <span className={`inline-wrap ${className}`}>
      {tokens.map((token, idx) => {
        // Group Mentions
        if (token === "@officers") {
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-rose-500/15 text-rose-400 font-bold px-1.5 py-0.5 rounded-md border border-rose-500/30 text-xs mx-0.5"
              title="Admins & Officers Mention"
            >
              <Shield className="w-3 h-3 text-rose-400" />
              <span>@officers</span>
            </span>
          );
        }

        if (token === "@everyone" || token === "@members") {
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-cyan-500/15 text-cyan-400 font-bold px-1.5 py-0.5 rounded-md border border-cyan-500/30 text-xs mx-0.5"
              title={token === "@members" ? "All Board Members Mention" : "Everyone Mention"}
            >
              <Users className="w-3 h-3 text-cyan-400" />
              <span>{token}</span>
            </span>
          );
        }

        if (
          ["@firstyear", "@secondyear", "@thirdyear", "@fourthyear", "@fifthyear", "@graduate"].includes(
            token.toLowerCase()
          )
        ) {
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 bg-purple-500/15 text-purple-400 font-bold px-1.5 py-0.5 rounded-md border border-purple-500/30 text-xs mx-0.5"
            >
              <GraduationCap className="w-3 h-3 text-purple-400" />
              <span>{token}</span>
            </span>
          );
        }

        // Individual user mention: @username
        if (/^@[a-zA-Z0-9_\-\.]+$/.test(token)) {
          const username = token.substring(1);
          return (
            <Link
              key={idx}
              to={`/app/u/${username}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center text-primary font-semibold hover:underline bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20 text-xs mx-0.5 transition-colors"
            >
              {token}
            </Link>
          );
        }

        return <React.Fragment key={idx}>{token}</React.Fragment>;
      })}
    </span>
  );
}
